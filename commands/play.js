const ytapi = require('./YoutubeAPI.js');

module.exports = {
	name: 'play',
	args: true,
	category: 'music',
	description: 'Play some music!',
	usage: '{search query/youtube url}',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		const guildID = msg.guild.id;
		const server = cli.servers.get(guildID);

		let search;
		if (args[0].toLowerCase().startsWith('http')) {
			search = args[0];
		}
		else {
			search = args.join(' ');
		}

		ytapi.getVideo(search).then(videos => {
			const fields = [];
			for (let i = 0; i < videos.length; i++) {
				fields.push({
					'name': '\u200b',
					'value': `${i + 1}) **${videos[i].title}** by *${videos[i].channelTitle}*`,
				});
			}
			fields.push({
				'name': '\u200b',
				'value': '**If your desired song is not found type: `0`**',
			});
			const chooseEmbed = {
				'title': 'Music',
				'description': '**Choose the song you want to play:**',
				'color': 2348939,
				'thumbnail': {
					'url': videos[0].thumbnail,
				},
				'footer': {
					'icon_url': cli.user.avatarURL,
					'text': '!play',
				},
				'fields': fields,
			};
			let video;
			msg.channel.send({ 'embed': chooseEmbed }).then(sM => {
				msg.channel.awaitMessages(rep => {
					return rep.author.id === msg.author.id && (!isNaN(rep.content) && (parseInt(rep.content) >= 0 || parseInt(rep.content) < videos.length));
				}, { maxMatches : 1, time : 30000, errors : ['time'] }).then(col => {
					if (parseInt(col.first().content) == 0) return sM.edit('**Song not selected: user aborted.**', { 'embed': null });
					video = videos[parseInt(col.first().content) - 1];
					theRest();
				}).catch(err => {
					sM.edit('**No response. Aborted**', { 'embed': null });
				});
			});

			function theRest() {
				if (server.queue.length < 5) server.queue.push(video);
				else return msg.channel.send('**Queue is full**! Please wait before adding another song.');

				if (server.dispatcher && server.queue.length > 0) {
					const embed = {
						'title': 'Music',
						'description': `**Added to queue**:\n${video.title}`,
						'color': 2348939,
						'footer': {
							'icon_url': cli.user.avatarURL,
							'text': '!play',
						},
						'thumbnail': {
							'url': video.thumbnail,
						},
					};
					msg.channel.send({ 'embed': embed });
				}

				if(!msg.guild.voiceConnection) {
					msg.member.voiceChannel.join().then(connection => {
						if (!server.dispatcher) cli.play(msg, cli, connection);
					});
				}
			}

		}).catch(err => {
			console.error(err);
			msg.channel.send('Something went wrong.');
		});
	},
};

