module.exports = {
	name: 'ping',
	category: 'other',
	description: 'Ping!',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		msg.channel.send(`:ping_pong: **pong!** (**${Math.round(cli.ping)} ms**)`);
	},
};