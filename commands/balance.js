const commas = new Intl.NumberFormat('en-US');

module.exports = {
	name: 'balance',
	aliases: ['bal', 'money'],
	category: 'economy',
	description: 'See you balance or another user\'s balance',
	usage: '{@user}',
	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		if (!msg.mentions.users.size) {
			return msg.channel.send(`**${msg.author.username}**'s balance: **$${commas.format(uv.getBalance(msg.author.id))}**`);
		}
		const balList = msg.mentions.users.map(user => {
			return `**${user.username}**'s balance: **$${commas.format(uv.getBalance(user.id))}**`;
		});
		msg.channel.send(balList);
	},
};