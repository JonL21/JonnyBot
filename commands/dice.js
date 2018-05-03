module.exports = {
	name : 'dice',
	aliases: ['die'],
	args: true,
	category: 'fun',
	cooldown: 6,
	description : 'Roll a die or set of dice',
	usage: '[# of dice]',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);

		let dices = parseInt(args.shift());

		if (isNaN(dices)) dices = 1;
		else if (dices > 100) dices = 100;

		let output = `:game_die: **DICE** :game_die:\n\n**${dices} die/dies are rolled.**\n`;

		msg.channel.send(output).then(sentMsg => {
			const dieFace = [ ':one:', ':two:', ':three:', ':four:', ':five:', ':six:' ];
			let total = 0;

			for (let i = 0; i < dices; i++) {
				var die = Math.floor(Math.random() * 6 + 1);
				total += die;
				if (i != 0 && i % 10 == 0) output += '\n';
				output += dieFace[die - 1];
			}
			output += `\n\n**The total is ${total}.**`;
			sentMsg.edit(output);
		});
	},
};