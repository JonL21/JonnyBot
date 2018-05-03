/*
	POKER (TEXAS HOLDEM)
		THE JACKPOT
			varies: BET * 2
*/

// French style cards
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = [':spades:', ':diamonds:', ':hearts:', ':clubs:'];

// The possible poker hands
const ranking = ['High Card', 'PAIR', 'TWO PAIR', 'THREE OF A KIND', 'STRAIGHT', 'FLUSH', 'FULL HOUSE', 'FOUR OF A KIND', 'STRAIGHT FLUSH', 'ROYAL FLUSH'];
/*
	9 ROYAL FLUSH - 10 J Q K A of SAME RANK
	8 STRAIGHT FLUSH - same suit, consecutive order
	7 FOUR OF A KIND - 4 of same rank
	6 FULL HOUSE - 3 of same rank, 2 of same rank
	5 FLUSH - consecutive order
	4 STRAIGHT - same suit
	3 THREE OF A KIND - 3 of same rank
	2 TWO PAIR - Two 2 of same rank
	1 PAIR - same rank
	0 High Card - default
*/

const msgTitle = ':moneybag: **POKER** :moneybag:';

let deck = [];

const MIN_BET = 5;

module.exports = {
	name: 'poker',
	aliases: ['pkr'],
	category: 'casino',
	cooldown: 20,
	description: 'Gambling at its peak',
	usage: '{amount to bet}',

	async execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);

		// Generate a deck of 52 cards
		deck = [];
		for (let x = 0; x < suits.length; x++) {
			for (let y = 0; y < ranks.length; y++) {
				deck.push(ranks[y] + '' + suits[x]);
			}
		}

		let bet, prize = 0;
		const target = msg.mentions.users.first() || msg.author; // Get user's id
		const communitycards = []; // Holds the cards all players share
		const holes = [ [], [] ]; // Holds player's + AI cards
		const values = new Array(holes.length).fill(0); // Holds the poker hand each player has
		let deal = true; // Whether or not another card is dealt to the CC
		let showdown = false;
		let allHoles;
		let AIfolded = false;

		for (let xx = 0; xx < 2; xx++) {
			communitycards.push(hit());
			for (const hole of holes) {
				hole.push(hit());
			}
		}

		msg.channel.send(`${msgTitle}\n\n__**PRE-GAME**__\n\n**${msg.author.username}'s cards**: **${holes[holes.length - 1]}**\n\nBets start at **$${MIN_BET}**.\nType \`bet\`, \`check\`, or \`fold\``).then(sentMessage => {
			msg.channel.awaitMessages(response => {
				if (response.author.id == msg.author.id && (response.content.startsWith('bet') || response.content === 'check' || response.content === 'fold')) return true;
				return false;
			}, {
				maxMatches : 1,
				time : 30000,
				errors : ['time'],
			}).then(collected => {
				const respArgs = collected.first().content.trim().split(/ +/g);
				const pkrCmd = respArgs.shift().toLowerCase();
				switch (pkrCmd) {
				case 'bet':
					bet = parseInt(respArgs.shift());
					if (isNaN(bet) || bet <= MIN_BET) bet = MIN_BET;
					break;
				case 'check':
					bet = MIN_BET;
					break;
				case 'fold':
					return sentMessage.edit(`${msgTitle}\n\nGame did not start. User folded.`);
				}
				deductBet();
				nextTurn(holes, communitycards, values);
			}).catch((err) => {
				console.error(err);
				sentMessage.edit(`${msgTitle}\n\n**No response. Game ended.**`);
			});
		}).catch((err) => { console.error(err); });

		function nextTurn(hs, cc, vs) {
			if (deal) {
				cc.push(hit());
				for (let x = 0; x < holes.length; x++) {
					vs[x] = calc(new Array().concat(hs[x], cc));
				}
			}

			const displayCards = [], displayCC = [];
			for (const hole of hs) {
				displayCards.push(hole);
			}
			for (const card of cc) {
				displayCC.push(card);
			}

			showCards(false);
			const pkrMsg = `${msgTitle}\n\n__Community Cards__: ${displayCC}\n__Prize Pool__: **$${prize}**\n\n${allHoles}\n\n`;
			if (!showdown) {
				if (cc.length == 5) deal = false; // Stop dealing after 5 cards in CC
				const AIr = AIthink(vs[0], vs[1]);
				let AIbet;
				switch(AIr[0]) {
				case 'bet':
					AIbet = parseInt(AIr[1]);
					msg.channel.send(`${pkrMsg}\n\n__AI betted **$${AIbet}.**__\nType \`bet\` or \`fold\``).then(sentMessage => {
						// Wait for user response
						msg.channel.awaitMessages(response => {
							// Ensure this response comes from user who called !poker and its contents say "bet","fold"
							if (response.author.id == msg.author.id && (response.content.startsWith('bet') || response.content === 'fold')) return true;
							return false;
						}, { // Options for awaitMessages
							maxMatches : 1, // Only search for one matching message
							time : 30000, // Wait 30s
							errors : ['time'],
						}).then(collected => {
							const respArgs = collected.first().content.trim().split(/ +/g);
							const pkrCmd = respArgs.shift().toLowerCase();
							switch(pkrCmd) {
							case 'bet':
								bet = parseInt(respArgs.shift());
								if (isNaN(bet) || bet <= MIN_BET) bet = MIN_BET;
								else if (isNaN(bet) || bet < AIbet) bet = AIbet;
								deductBet();
								break;
							case 'fold':
								return sentMessage.edit(`${msgTitle}\n\n**Game ended before Showdown! User folded...`);
							}
							setTimeout(() => nextTurn(hs, cc, vs), 1000);
						}).catch((err) => {
							console.error(err);
							sentMessage.edit(`${msgTitle}\n\n**No response. Game ended.**`);
						});
					}).catch((err) => { console.error(err); });
					break;
				case 'check':
					msg.channel.send(`${pkrMsg}Type \`bet\`, \`check\`, or \`fold\``).then(sentMessage => {
						// Wait for user response
						msg.channel.awaitMessages(response => {
							// Ensure this response comes from user who called !poker and its contents say "bet","check","fold"
							if (response.author.id == msg.author.id && (response.content.startsWith('bet') || response.content === 'check' || response.content === 'fold')) return true;
							return false;
						}, { // Options for awaitMessages
							maxMatches : 1, // Only search for one matching message
							time : 30000, // Wait 30s
							errors : ['time'],
						}).then(collected => {
							const respArgs = collected.first().content.trim().split(/ +/g);
							const pkrCmd = respArgs.shift().toLowerCase();
							switch(pkrCmd) {
							case 'bet':
								bet = parseInt(respArgs.shift());
								if (isNaN(bet) || bet <= MIN_BET) bet = MIN_BET;
								deductBet();
								break;
							case 'check':
								if (!deal) showdown = true;
								break;
							case 'fold':
								return sentMessage.edit(`${msgTitle}\n\n**Game ended before Showdown! User folded...`);
							}
							setTimeout(() => nextTurn(hs, cc, vs), 1000);
						}).catch((err) => {
							console.error(err);
							sentMessage.edit(`${msgTitle}\n\n**No response. Game ended.**`);
						});
					}).catch((err) => { console.error(err); });
					break;
				case 'fold':
					AIfolded = true;
				}
			}
			else {
				showCards(true);
				if (AIfolded) {
					msg.channel.send(`${pkrMsg}AI folded!\n**${msg.author.username}** won **$${prize}**!`);
					uv.add(target.id, prize);
				}
				else {
					const playersPokerHand = vs[vs.length - 1];
					if (playersPokerHand > vs[0]) {
						msg.channel.send(`${pkrMsg}**${msg.author.username}**'s **${ranking[playersPokerHand]}** is the best poker hand!\n**${msg.author.username}** won **$${prize}**!`);
						uv.add(target.id, prize);
					}
					else if (playersPokerHand == vs[0]) {
						msg.channel.send(`${pkrMsg}Both players have the best poker hand! Both split the prize (**$${prize}**)!`);
						uv.add(target.id, Math.floor(prize / 2));
					}
					else {
						msg.channel.send(`${pkrMsg}AI's **${ranking[vs[0]]}** is the best poker hand!\n**You lost...**`);
					}
				}
			}

			function showCards(showAll) {
				allHoles = '';
				for (let x = 0; x < displayCards.length; x++) {
					if (x == displayCards.length - 1) allHoles += `**${msg.author.username}'s cards**: **${displayCards[x]}** (**${ranking[vs[x]]}**)\n`;
					else if (showAll || showdown) allHoles += `Player ${x + 1}'s cards: ${displayCards[x]} (${ranking[vs[x]]})\n`;
					else allHoles += `Player ${x + 1}'s cards: ??\n`;
				}
			}

		}

		function deductBet() {
			if (uv.getBalance(target.id) < bet) return msg.channel.send('**Insufficient Funds.**').then(sentMessage => { sentMessage.delete(6000); });
			else uv.add(target.id, -bet);
			prize += bet * 2;
		}
	},
};

// Deal another card to player
function hit() {
	const cardToRemove = Math.floor(Math.random() * deck.length); // Randomize which card to remove from deck
	const newCard = deck.slice(cardToRemove, cardToRemove + 1); // Copy that card to send to hand
	deck.splice(cardToRemove, 1); // Remove the card for the deck
	return newCard; // push the card to player's hand
}

function AIthink(v, pv) {
	const chanceToBet = Math.random() * (v / 10);
	const AIresp = [];
	/* AI will...
		0.7 - check
		0.2 - will blindly bet $5 or check
		0.09 - will bluff and bet a random amount IF best poker hand is less than STRAIGHT, otherwise will either check or fold
		0.01 - will strategically determine best course of action (?)
	*/
	if (chanceToBet <= 0.7) {
		AIresp.push('check');
	}
	else if (chanceToBet <= 0.9) {
		const x = 1 + Math.floor(Math.random() * 2);
		if (x == 1) {
			AIresp.push('bet').AIbet.push('5');
		}
		else {
			AIresp.push('check');
		}
	}
	else if (chanceToBet <= 0.99) {
		if (v < 5) {
			AIresp.push('bet').AIresp.push('bet').push(5 * Math.floor(Math.random() * 10));
		}
		else {
			const x = 1 + Math.floor(Math.random() * 2);
			if (x == 2) {
				AIresp.push('check');
			}
			else {
				AIresp.push('fold');
			}
		}
	}
	else if (v < pv) {
		AIresp.push('bet').push(10 * Math.floor(Math.floor() * 3));
	}
	return AIresp;
}

// Determine the highest possible hand
function calc(pile) {
	pile = sortByRank(pile);

	// Count the amount of each card in player's hand + community cards
	const rankCounter = Array(13).fill(0), suitCounter = Array(4).fill(0);
	for (const card of pile) {
		rankCounter[getNumericalValue(card) - 2]++;
		suitCounter[gNVofSuit(card)]++;
	}

	// Determine the best possible poker hand
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

/*
	====================================
			HELPER METHODS BELOW
	====================================
*/

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