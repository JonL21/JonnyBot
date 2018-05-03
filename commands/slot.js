/*
	SLOT
		THE JACKPOT
			$1,000,000 * 100 = $100,000,000
		DOUBLE OR NOTHING JACKPOT
			$200,000,000
*/

// Current slot outcomes, stored in array
const options = [
	':apple:', ':grapes:', // TIER I
	':cherries:', ':peach:', ':pineapple:', // TIER II
	':tangerine:', ':kiwi:', ':avocado:', // TIER III
	':gem:', // TIER IV
	':seven:', // TIER V
];
const chance = [
	0.5,		// TIER I   0.5			1/2 odds
	0.9,		// TIER II  0.4			2/5 odds
	0.99,		// TIER III 0.09		9/100 odds
	0.99999,	// TIER IV  0.00999		999/100000 odds
	1,			// TIER V   0.00001		1/100000 odds
];
const MAX_BET = 1000000;
const commas = new Intl.NumberFormat('en-US');

module.exports = {
	name: 'slot',
	aliases: ['slots'],
	category: 'casino',
	cooldown: 5,
	embed: {
		'title': 'SLOT MACHINE',
		'description': 'Aliases: `slots`\nUsage: {amount to bet}',
		'color': 13232598,
		'footer': {
			'icon_url': 'https://cdn.discordapp.com/avatars/368918984717893633/025fef62eec7d01d6f24aaed40ccf7bb.png?size=256',
			'text': '!help slot',
		},
		'fields': [
			{
				'name': 'NOTE: ',
				'value': '**ONLY THE MIDDLE ROW COUNTS FOR MATCHES**',
			},
			{
				'name': 'TIER I: :apple: :grapes:',
				'value': '\t**Match two TIER 1 fruits: `Bet ×1` | Match three TIER 1 fruits: `Bet ×3`**\n',
			},
			{
				'name': 'TIER II: :cherries: :peach: :pineapple:',
				'value': '\t**Match two TIER 2 fruits: `Bet ×2` | Match three TIER 2 fruits: `Bet ×5`**\n',
			},
			{
				'name': 'TIER III: :tangerine: :kiwi: :avocado:',
				'value': '\t**Match two TIER 3 fruits: `Bet ×3` | Match three TIER 3 frutis: `Bet ×10`**\n',
			},
			{
				'name': 'TIER IV: :gem:',
				'value': '\t**Match three gems: `Bet ×15`**\n',
			},
			{
				'name': 'TIER V: :seven:',
				'value': '\t**Match three 7\'s: `Bet ×25`**',
			},
		],
	},
	usage: '{amount to bet}',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);

		// Get player bet and adjust if not in range
		let bet = parseInt(args.shift());
		if (isNaN(bet) || bet <= 0) bet = 1;
		else if (bet > MAX_BET) bet = MAX_BET;

		// Debit bet from player balance or exit if they broke
		const target = msg.mentions.users.first() || msg.author;
		if (uv.getBalance(target.id) < bet) return msg.reply('**you have insufficient funds.**').then(sentMessage => sentMessage.delete(6000));
		else uv.add(target.id, -bet);

		let slots = []; // Declare an array to hold slot display 'snapshots'
		let output; // Declare var to store what bot will output in chat

		generateSlotDisplay(); // Call this method once...

		msg.channel.send(output).then((sentMessage) => { // ...and send message to channel where !slot was called...
			// ... then edit that message only for slot animations and result
			play(true);
			function play(playAgain) {
				setTimeout(function() { // setTimeout used to wait 1 second before changing slot display
					for (let x = 0; x < 2; x++) {
						setTimeout(function() { // setTimeout used to wait 1 second between each iteration of loop
							generateSlotDisplay();
							// Try sending out new slot display and catch any errors
							try { sentMessage.edit(output); }
							catch (err) { console.error(err); }
						}, x * 750);
					}
				}, 1000);

				setTimeout(function() { // Wait 3.25 seconds before showing final slot results
					let result = false; // Declare var that determines if player wins or loses
					let payout = 0; // Initialize payout var
					if (!playAgain) generateSlotDisplay();

					// Count the frequency of each fruit in the middle row of slots
					var counts = {};
					slots.slice(3, 6).forEach(fruit => counts[fruit] = (counts[fruit] || 0) + 1);
					const fruits = Object.keys(counts);
					const frc = Object.values(counts);
					for (let x = 0; x < fruits.length; x++) {
						if (frc[x] == 2) payout = getPayout(false, fruits[x]);
						else if (frc[x] == 3) payout = getPayout(true, fruits[x]);
					}

					if (payout != 0) result = true;
					// Add results to bot's output
					if (result && !playAgain) output += `  **=== WON ===**  \n\n**${msg.author.username}** doubled **$${commas.format(bet / 2)}** and won **$${commas.format(payout)}**!`;
					else if (result) output += `  **=== WON ===**  \n\n**${msg.author.username}** threw away **$${commas.format(bet)}** and won **$${commas.format(payout)}**!`;
					else if (!playAgain) output += `  **=== LOST ===**  \n\n**${msg.author.username}** tried to double **$${commas.format(bet / 2)}** and lost everything.`;
					else output += `  **=== LOST ===**  \n\n**${msg.author.username}** threw away **$${commas.format(bet)}** and lost everything.`;

					let end = new String(output);

					if (playAgain && result) {
						output += '\nReact with 💸 to get **DOUBLE OR NOTHING**!';
					}
					else {
						// Update player's balance in database
						uv.add(target.id, payout);
						output += `\nBalance: **$${commas.format(uv.getBalance(target.id))}**.`;
					}

					// Send final edit of bot's message
					sentMessage.edit(output).then(() => {
						if (playAgain && result) {
							sentMessage.react('💸').then(() => {
								const filter = (react, user) => {
									return react.emoji.name == '💸' && user.id === msg.author.id;
								};
								sentMessage.awaitReactions(filter, { max: 1, time: 10000, errors: ['time'] }).then(() => {
									bet = payout *= 2;
									sentMessage.clearReactions();
									play(false);
								}).catch(() => {
									sentMessage.clearReactions();
									uv.add(target.id, payout);
									end += `\nBalance: **$${commas.format(uv.getBalance(target.id))}**.`;
									sentMessage.edit(end);
								});
							});
						}
					});
				}, 2300);
			}
		}).catch((err) => console.error(err));

		// For 'animating' the slot display
		function generateSlotDisplay() {
			slots = [];
			for (let i = 0, r = Math.random(); i < 9; i++, r = Math.random()) {
				let fruit = 0;
				if (r < chance[0]) fruit = options[Math.floor(Math.random() * 2)];
				else if (r < chance[1]) fruit = options[2 + Math.floor(Math.random() * 3)];
				else if (r < chance[2]) fruit = options[5 + Math.floor(Math.random() * 3)];
				else if (r < chance[3]) fruit = options[8];
				else fruit = options[9];
				slots.push(fruit);
			}
			output = `**:slot_machine:   SLOTS   :slot_machine:**\n  [ ${slots[0]}:${slots[1]}:${slots[2]} ]\n  [ ${slots[3]}:${slots[4]}:${slots[5]} ] **<**\n  [ ${slots[6]}:${slots[7]}:${slots[8]} ]\n`;
		}

		// Getting mutiplier on bet
		function getPayout(threes, fruit) {
			if (threes) {
				if (options.indexOf(fruit) < 2) return bet * 10;
				else if (options.indexOf(fruit) < 5) return bet * 20;
				else if (options.indexOf(fruit) < 8) return bet * 35;
				else if (options.indexOf(fruit) == 8) return bet * 65;
				else if (options.indexOf(fruit) == 9) return bet * 100;
			}
			if (options.indexOf(fruit) < 2) return bet;
			else if (options.indexOf(fruit) < 5) return bet * 3;
			else if (options.indexOf(fruit) < 8) return bet * 5;
		}
	},
};