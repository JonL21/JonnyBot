module.exports = {
	name: 'volume',
	args: true,
	category: 'music',
	description: 'Change the volume of the music',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);

		const volume = parseInt(args.shift());
		if (isNaN(volume) || volume < 0 || volume > 100) return msg.reply('please give a **number** between **1** and **100**.');

		cli.volume.set(msg.guild.id, Number(volume) / 100);
		const server = cli.servers.get(msg.guild.id);
		if (server.dispatcher) {
			server.dispatcher.setVolume(cli.volume.get(msg.guild.id));
			msg.channel.send(`Volume has been set to **${volume}%**`);
		}
	},
};