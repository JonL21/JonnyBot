module.exports = {
	name: 'stop',
	category: 'music',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		const server = cli.servers.get(msg.guild.id);
		if (msg.guild.voiceConnection) {
			msg.guild.voiceConnection.disconnect();
			server.queue.splice(0, server.queue.length);
		}
	},
};