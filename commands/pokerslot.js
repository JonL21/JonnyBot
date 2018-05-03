/*
	POKERSLOT
		To-Do:
			- Fix misread poker hands
		THE JACKPOT
			$5000 * ($5000)^(9 * 0.18) = $987,497
*/

// French style cards
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = [':spades:', ':diamonds:', ':hearts:', ':clubs:'];

// The possible poker hands
const ranking = ['High Card', 'PAIR', 'TWO PAIR', 'THREE OF A KIND', 'STRAIGHT', 'FLUSH', 'FULL HOUSE', 'FOUR OF A KIND', 'STRAIGHT FLUSH', 'ROYAL FLUSH'];

const MAX_BET = 5000000;
const msgTitle = '**:slot_machine: :moneybag: POKER SLOTS :moneybag: :slot_machine:**\n';

module.exports = {
	name: 'pokerslot',
	aliases: ['pokerslots', 'ps'],
	category: 'casino',
	cooldown: 10,
	description: 'GAMBLING SLOTS',
	usage: '{amount to bet}',

	async execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);

		// Get player bet and adjust if not in range
		let bet = parseInt(args.shift());
		if (isNaN(bet) || bet <= 0) bet = 1;
		else if (bet > MAX_BET) bet = MAX_BET;

		// Debit bet from player balance or exit if they broke
		const target = msg.mentions.users.first() || msg.author;
		if (uv.getBalance(target.id) < bet) return msg.reply('**you have insufficient funds.**').then(sentMessage => sentMessage.delete(6000));
		else uv.add(target.id, -bet);

		const deck = [];
		for (const suit of suits) {
			for (const rank of ranks) {
				deck.push(rank + '' + suit);
			}
		}

		const slots = [ '?:question:', '?:question:', '?:question:', '?:question:', '?:question:'];
		let output;

		output = `${msgTitle}=====================\n[  **${slots.map(x => x).join(' ')}** ]\n=====================`;
		msg.channel.send(output).then(sentMessage => {
			setTimeout(() => {
				for (let a = 0; a < 5; a++) {
					setTimeout(() => {
						slots[a] = deal();
						output = `${msgTitle}=====================\n[  **${slots.map(x => x).join(' ')}** ]\n=====================`;
						sentMessage.edit(output);
					}, a * 1000);
				}
			}, 1000);

			setTimeout(() => {
				const rankCounter = Array(13).fill(0), suitCounter = Array(4).fill(0);
				for (const card of slots) {
					rankCounter[getNumericalValue(card) - 2]++;
					suitCounter[gNVofSuit(card)]++;
				}
				sortByRank(slots);
				const value = calc(rankCounter, suitCounter);

				output = `${msgTitle}=====================\n[  **${slots.map(x => x).join(' ')}** ]\n=====================\nPOKER HAND: **${ranking[value]}**`;
				if (value > 0) {
					const payout = bet + Math.floor(Math.pow(bet, value * 0.18));
					sentMessage.edit(`${output}\n**${target.username}**, you won **$${payout}**!`);
					uv.add(target.id, payout);
				}
				else {
					sentMessage.edit(`${output}\n**${target.username}**, you lost...`);
				}
			}, 6 * 1000);
		});

		function deal() {
			const cardnum = Math.floor(Math.random() * deck.length);
			const card = deck[cardnum];
			deck.splice(cardnum, 1);
			return card;
		}
	},
};

function calc(rankCounter, suitCounter) {
	if(isRoyal(rankCounter, suitCounter)) return 9;
	else if (isStraight(rankCounter, suitCounter) && isFlush(rankCounter, suitCounter)) return 8;
	else if (isFOAK(rankCounter, suitCounter)) return 7;
	else if (isTOAK(rankCounter, suitCounter) && isPair(rankCounter, suitCounter)) return 6;
	else if (isFlush(rankCounter, suitCounter)) return 5;
	else if (isStraight(rankCounter, suitCounter)) return 4;
	else if (isTOAK(rankCounter, suitCounter)) return 3;
	else if (isTwoPair(rankCounter, suitCounter)) return 2;
	else if (isPair(rankCounter, suitCounter)) return 1;
	return 0;
}

// Sorts a hand by RANK
function sortByRank(hand) {
	let min;
	for (let x = 0; x < hand.length; x++) {
		min = x;
		for (let y = x + 1; y < hand.length; y++) {
			if (getNumericalValue(hand[y]) < getNumericalValue(hand[min])) min = y;
		}
		if (x != min) {
			const temp = hand[x];
			hand[x] = hand[min];
			hand[min] = temp;
		}
	}
	return hand;
}

// Sorts a hand by SUIT
function sortBySuit(hand) {
	let min;
	for (let x = 0; x < hand.length; x++) {
		min = x;
		for (let y = x + 1; y < hand.length; y++) {
			if (gNVofSuit(hand[y]) < gNVofSuit(hand[min])) min = y;
		}
		if (x != min) {
			const temp = hand[x];
			hand[x] = hand[min];
			hand[min] = temp;
		}
	}
	return hand;
}

// Returns the numerical value of Ace, Jack, Queen, King; Otherwise converts String to Number
function getNumericalValue(card) {
	const rank = card.toString().substring(0, card.toString().indexOf(':'));
	if (isNaN(rank)) {
		switch (rank) {
		case 'A':
			return 14;
		case 'J':
			return 11;
		case 'Q':
			return 12;
		case 'K':
			return 13;
		}
	}
	return parseInt(rank);
}

// Gets numerical value of suit
function gNVofSuit(card) {
	const suit = card.toString().substring(card.toString().indexOf(':'));
	switch(suit) {
	case ':clubs:':
		return 0;
	case ':diamonds:':
		return 1;
	case ':hearts:':
		return 2;
	case ':spades:':
		return 3;
	}
}

function isRoyal(rC, sC) {
	if ((rC[8] >= 1 && rC[9] >= 1 && rC[10] >= 1 && rC[11] >= 1 && rC[12] >= 1) &&
		(sC[0] >= 5 || sC[1] >= 5 || sC[2] >= 5 || sC[3] >= 5)) {
		return true;
	}
	return false;
}

function isStraight(rC, sC) {
	for (let y = rC.length; y > 4; y--) {
		if (rC[y - 1] > 0 && rC[y - 2] > 0 && rC[y - 3] > 0 && rC[y - 4] > 0 && rC[y - 5] > 0) return true;
	}
	return false;
}

function isFlush(rC, sC) {
	if (sC[0] >= 5 || sC[1] >= 5 || sC[2] >= 5 || sC[3] >= 5) return true;
	return false;
}

function isFOAK(rC) {
	for (let x = rC.length; x > 0; x--) {
		if (rC[x] == 4) return true;
	}
	return false;
}

function isTOAK(rC) {
	for (let x = rC.length; x > 0; x--) {
		if (rC[x] == 3) return true;
	}
	return false;
}

function isTwoPair(rC) {
	let pairCounter = 0;
	for (let x = rC.length; x > 0; x--) {
		if (rC[x] == 2) pairCounter++;
	}
	if (pairCounter >= 2) return true;
	return false;
}

function isPair(rC) {
	for (let x = rC.length; x > 0; x--) {
		if (rC[x] == 2) return true;
	}
	return false;
}