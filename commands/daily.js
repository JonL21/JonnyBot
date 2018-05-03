module.exports = {
	name: 'free',
	category: 'economy',
	cooldown: 86400,
	description: 'Free money that recharges every 24 hours!',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);

		const target = msg.mentions.users.first() || msg.author;
		uv.add(target.id, 100);
		const date = new Date();
		date.setUTCDate(date.getUTCDate() + 1);
		uv.setLastRedeemed(target.id, date);
		msg.reply('here\'s your **$100** for today!');
	},
};