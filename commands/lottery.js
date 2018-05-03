/*
	LOTTERY
		To-Do
			- Make it work, avoid overflowing heap memory
		THE JACKPOT
			varies: 10 * number of tickets sold
 */

const MAX_BET = 20; // The number of tickets one player can buy
const TICKET_COST = 10; // The cost of one ticket
const LENGTH = 60 * 60 * 1000; // The length in milliseconds of one lottery session
const msgTitle = '[**LOTTERY**] :money_with_wings: | ';

// The lottery's pool
const lot = {
	winnings: 0, // $$$ prize
	participants: new Map(), // Holds each participating player, with their number of tickets
	timeSlot: Date.now() + LENGTH, // The time at which the lottery ends
	ongoing: true, // If players are allowed to buy tickets
	lastWinner: 0,
	lastWinning: 0,
};

module.exports = {
	name: 'lottery',
	aliases: ['lot'],
	category: 'casino',
	cooldown: 5,
	embed: {
		'title': 'LOTTERY',
		'description': 'Aliases: `lot`',
		'color': 3600,
		'footer': {
			'icon_url': 'https://cdn.discordapp.com/avatars/368918984717893633/025fef62eec7d01d6f24aaed40ccf7bb.png?size=256',
			'text': '!help lottery',
		},
		'fields': [
			{
				'name': 'How To Play:',
				'value': 'Use !lottery to buy a ticket\nYou can also specify how many tickets you would like to buy\nEach ticket costs **$10**\nA winner is DM\'d every hour!',
			},
		],
	},
	length: LENGTH,
	usage: '{tickets to buy, time}',

	async execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		if (!lot.ongoing) return msg.channel.send(`${msgTitle}The lottery has recently ended! It will start again momentarily. The last winner was **${cli.users.get(lot.lastWinner).username}**, who won **$${lot.lastWinning}**!`);

		if (isNaN(args[0])) {
			const time = (args[0] === 'info') ? true : false;
			if (time) {
				const timeLeft = new Date(lot.timeSlot - Date.now());
				const timeMsg = `There's **${timeLeft.getMinutes()}m, ${timeLeft.getSeconds()}s** remaining until the winner is drawn! `;
				if (lot.participants.size == 0) return msg.channel.send(`${msgTitle}${timeMsg}Currently no one is playing in this session.`);
				else if (lot.participants.size == 1) return msg.channel.send(`${msgTitle}${timeMsg}Currently **${lot.participants.size} player** is participating to have a chance at winning **$${lot.winnings}**!`);
				else return msg.channel.send(`${msgTitle}${timeMsg}Currently **${lot.participants.size} players** are participating to have a chance at winning **$${lot.winnings}**!`);
			}
		}

		// Get player bet and adjust if not in range
		let bet = parseInt(args.shift());
		if (isNaN(bet) || bet <= 0) bet = 1;
		else if (bet > MAX_BET) bet = MAX_BET;

		// Debit bet from player balance or exit if they broke
		const target = msg.mentions.users.first() || msg.author;
		if (uv.getBalance(target.id) < (bet * TICKET_COST)) return msg.reply('**you have insufficient funds.**').then(sentMessage => { sentMessage.delete(6000); });
		else uv.add(target.id, -(bet * TICKET_COST));

		// Add tickets to pool
		if (lot.participants.has(msg.author.id)) lot.participants.set(msg.author.id, lot.participants.get(msg.author.id) + bet);
		else lot.participants.set(msg.author.id, bet);
		lot.winnings += (bet * TICKET_COST);
		msg.channel.send(`${msgTitle}**${msg.author.username}** bought **${bet} ticket(s)**, bringing their total to ${lot.participants.get(msg.author.id)}!`);
	},
	endLot(cli, uv) {
		// Declare a setInterval that resets the lottery every LENGTH milliseconds
		if (lot.participants.size == 0) return;
		console.log('Lottery: reset!');

		// Put lottery on 'cooldown' for 5 seconds after every session
		lot.ongoing = false;
		setTimeout(() => {
			lot.ongoing = true;
		}, 5000);

		// Randomly choose winner
		const prtcpnts = [];
		lot.participants.forEach((tckts, id) => {
			// Add user x times, x being the number of tickets they bought
			for (var x = 0; x < tckts; x++) {
				prtcpnts.push(id);
			}
		});
		const winnerID = prtcpnts[Math.floor(Math.random() * prtcpnts.length)];
		const winner = cli.users.get(winnerID);
		uv.add(winnerID, lot.winnings);
		try {
			winner.send(`[**LOTTERY**] :money_with_wings: | **Congratulations, you won the lottery! You won $${lot.winnings}!**`);
		}
		catch (err) {
			console.error('Lottery: Unable to DM winner.');
		}
		lot.lastWinner = winnerID;
		lot.lastWinning = lot.winnings;

		// Reset pool
		lot.winnings = 0;
		lot.participants.clear();
		lot.timeSlot = Date.now() + LENGTH;
	},
};