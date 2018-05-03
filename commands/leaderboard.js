module.exports = {
	name: 'leaderboard',
	aliases: ['top'],
	category: 'economy',
	description: 'See the most rich players',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);

		return msg.channel.send(
			uv.sort((a, b) => b.balance - a.balance)
				.filter(user => cli.users.has(user.user_id))
				.first(10)
				.map((user, position) => `(${position + 1}) ${(cli.users.get(user.user_id).tag)}: $${user.balance}`)
				.join('\n'),
			{ code: true }
		);
	},
};