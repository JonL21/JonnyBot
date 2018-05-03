module.exports = {
	name: 'skip',
	category: 'music',
	description: 'Skip the current song',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		const server = cli.servers.get(msg.guild.id);
		if (server.dispatcher) {
			server.dispatcher.end();
		}
	},
};