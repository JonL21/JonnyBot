module.exports = {
	name: 'playing',
	aliases: ['np'],
	category: 'music',
	description: 'Show what is currently being played',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		if (cli.nowPlaying.get(msg.guild.id)) {
			const video = cli.nowPlaying.get(msg.guild.id);
			const embed = {
				'title': 'Music',
				'description': `**Now Playing**: \n${video.title}`,
				'color': 2348939,
				'footer': {
					'icon_url': cli.user.avatarURL,
					'text': '!playing',
				},
				'thumbnail': {
					'url': video.thumbnail,
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
					'text': '!playing',
				},
			};
			msg.channel.send({ 'embed': embed });
		}
	},
};