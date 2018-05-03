module.exports = {
	name: 'queue',
	category: 'music',
	description: 'See what songs are next in line to be played',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		const gID = msg.guild.id;
		if (cli.nowPlaying.get(gID)) {
			const video = cli.nowPlaying.get(gID);
			const server = cli.servers.get(gID);
			let desc = `**Now Playing**:\n${video.title}\n\n**Queue**:\n`;
			for (const vid of server.queue) {
				desc += `- ${vid.title}\n`;
			}
			const embed = {
				'title': 'Music',
				'description': `${desc}`,
				'color': 2348939,
				'footer': {
					'icon_url': cli.user.avatarURL,
					'text': '!queue',
				},
			};
			msg.channel.send({ 'embed': embed });
		}
		else {
			const embed = {
				'title': 'Music',
				'description': '**No music is playing**.',
				'color': 2348939,
				'footer': {
					'icon_url': cli.user.avatarURL,
					'text': '!queue',
				},
			};
			msg.channel.send({ 'embed': embed });
		}
	},
};