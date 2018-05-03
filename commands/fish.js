const { Users, Fish } = require('../dbObjects'); // Requires tables
const pond = [ // What can be caught
	':bug:', ':butterfly:', ':fallen_leaf:',					// Trash (0.25 chance)      0.3
	':fish:',													// Ubiquitous (0.35 chance) 0.4
	':tropical_fish:',											// Common (0.2 chance)      0.2
	':shrimp:', ':crab:', ':blowfish:', ':turtle:', ':squid:',	// Uncommon (0.1)           0.08
	':dolphin:',												// Rare (0.05)              0.01
	':whale:', ':whale2:', ':shark:',							// Elusive (0.015)          0.00025
	':duck:',													// What?! (0.035)           0.00975
];

const luck = [// Catch chances
	[0.3,				// Trash        0.3
		0.7,			// Ubiquitous   0.4
		0.9,			// Common       0.2
		0.98,			// Uncommon     0.08
		0.99,			// Rare         0.01
		0.99025,		// Elusive      0.00025
		1],				// What?!       0.00975

	[0.342,				// 0.342
		0.875,			// 0.533
		0.999,			// 0.124
		0.99974,			// 0.00074
		0.99999,			// 0.00025
		0.9999901,			// 0.0000001
		1],				// 0.0000099
];
const tiers = [ 'Trash', 'Ubiquitous', 'Common', 'Uncommon', 'Rare', 'Elusive', '?!' ];
const emoji = {
	'Trash': ':wastebasket:',
	'Ubiquitous': ':fish:',
	'Common': ':tropical_fish:',
	'Uncommon' : ':crab:',
	'Rare': ':dolphin:',
	'Elusive': ':whale:',
	'?!': ':duck:',
};
const DEFAULT_COST = 10; // How much one reel costs
const NET_CD = 104400; // How often one can use a net to catch fish
const netCooldowns = new Map();
const msgTitle = '[**FISH**] :fishing_pole_and_fish: | ';

module.exports = {
	name: 'fish',
	aliases: ['fishy'],
	category: 'fun',
	cooldown: 9,
	description: 'Reel in some fishies',
	usage: '{i/inv/inventory | s/sell [fish rarity] | n/net}',

	async execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);

		const target = msg.mentions.users.first() || msg.author;
		const user = await Users.findOne({ where: { user_id: msg.author.id } });
		const optionalArg = (args.length) ? args.shift().toLowerCase() : null;

		// For arguments
		if (optionalArg) {
			switch (optionalArg) {
			case 'i': case 'inv': case 'inventory':
				return this.getInventory(target, user, msg);
			case 's': case 'sell':
				return this.sellInventory(target, user, msg, args, uv);
			case 'n': case 'net':
				return this.castNet(target, user, msg);
			}
			return msg.channel.send(`${msgTitle}**Correct Usage**: \`!fish ${this.usage}\``);
		}

		// Check if player has enough money to fish
		if (uv.getBalance(target.id) < DEFAULT_COST) return msg.channel.send('**Insufficient Funds.**').then(sentMsg => sentMsg.delete(6000));
		else uv.add(target.id, -DEFAULT_COST);

		// Randomize caught fish
		let caught = '';
		const r = Math.random();
		if (r < luck[0][0]) caught = pond[Math.floor(Math.random() * 3)];
		else if (r < luck[0][1]) caught = pond[3];
		else if (r < luck[0][2]) caught = pond[4];
		else if (r < luck[0][3]) caught = pond[5 + Math.floor(Math.random() * 5)];
		else if (r < luck[0][4]) caught = pond[10];
		else if (r < luck[0][5]) caught = pond[11 + Math.floor(Math.random() * 3)];
		else caught = pond[13];

		// Output catch
		msg.channel.send(`${msgTitle}**${msg.author.username}** caught: ${caught}! (**-$${DEFAULT_COST}**)`);

		// Add fish to player's inventory
		const item = await Fish.findOne({ where: { name: caught } });
		await user.addItem(item);
	},
	async getInventory(target, user, msg) {
		// Get player's inv
		const items = await user.getItems();
		let list = '';
		for (const tier of tiers) {
			if (items.some(t => t.item.tier == tier)) {
				let sum = 0;
				items.filter(u => u.item.tier == tier).forEach(v => sum += v.amount);
				list += `${emoji[tier]} **${sum}** \`${tier}\` Fish\n`;
			}
		}
		// Output them
		return msg.channel.send(`${msgTitle}**${target.username}**, you have: \n\n${list}`);
	},
	async sellInventory(target, user, msg, args, uv) {
		if (!args.length) return msg.channel.send(`${msgTitle}**Please specify fish tier.**`).then(sentMsg => sentMsg.delete(6000));

		// Get the specified fish tier or return if DNE
		const x = args.shift();
		const fishOfTier = Fish.findAll({ where: { tier: { $like: x } } });
		if (tiers.findIndex(y => y.toLowerCase() == x) == -1) return msg.channel.send(`${msgTitle}**Please specify __valid__ fish tier.**`).then(sentMsg => sentMsg.delete(6000));

		// Go through player's inv, searching for fish with matching item_id's as those in fishOfTier
		let sellsFor = 0;
		let amt = 0;
		await user.getItems().each(async item => {
			fishOfTier.each(async fish => {
				if (fish.id == item.item_id) {
					sellsFor += fish.value * item.amount;
					amt += item.amount;
					await user.removeAll(fish);
				}
			});
		}).catch(err => console.error(err));
		if (amt == 0 && sellsFor == 0) return msg.channel.send(`${msgTitle}**${target.username}, you don't have any ${x} fish!**`);
		uv.add(target.id, sellsFor);

		return msg.channel.send(`${msgTitle}**${target.username}**, you sold **${amt}** ${x} fish for **$${sellsFor}**.`);
	},
	async castNet(target, user, msg) {
		const now = Date.now();

		// Cooldowns for fishnet
		if (!netCooldowns.has(target.id)) {
			netCooldowns.set(target.id, now);
			setTimeout(() => netCooldowns.delete(target.id), NET_CD);
		}
		else {
			const expire = netCooldowns.get(target.id) + NET_CD;
			if (now < expire) {
				const timeLeft = new Date(expire - now);
				return msg.reply(`**your fish net is recharging! Please wait ${timeLeft.getHours()} hours, ${timeLeft.getMinutes()} minutes, and ${timeLeft.getSeconds()} seconds before using it again.**`);
			}

			netCooldowns.set(target.id);
			setTimeout(() => netCooldowns.delete(target.id), NET_CD);
		}

		const caught = [];
		const numFish = 3 + Math.floor(Math.random() * 5);

		for (let x = 0, r = Math.random(); x < numFish; x++, r = Math.random()) {
			if (r < luck[1][0]) caught.push(pond[Math.floor(Math.random() * 3)]);
			else if (r < luck[1][1]) caught.push(pond[3]);
			else if (r < luck[1][2]) caught.push(pond[4]);
			else if (r < luck[1][3]) caught.push(pond[5 + Math.floor(Math.random() * 5)]);
			else if (r < luck[1][4]) caught.push(pond[10]);
			else if (r < luck[1][5]) caught.push(pond[11 + Math.floor(Math.random() * 3)]);
			else caught.push(pond[13]);
		}

		for (const fish of caught) {
			const item = await Fish.findOne({ where: { name: fish } });
			await user.addItem(item);
		}

		msg.channel.send(`${msgTitle}**${target.username}** caught: ${caught}!`);
	},
};