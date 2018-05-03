module.exports = {
	name: 'info',
	category: 'other',

	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);

		const target = msg.mentions.users.first() || msg.author;
		const memtarget = msg.mentions.members.first() || msg.member;
		let presence = target.presence.status;
		if (target.presence.game) {
			presence = target.presence.game.streaming ? `Streaming ${target.presence.game.name}` : `Playing ${target.presence.game.name}`;
		}
		const embed = {
			'author': {
				'name': target.username,
				'icon_url': target.displayAvatarURL,
			},
			'description': presence,
			'fields': [
				{
					'name': 'User created:',
					'value': `On ${new Date(target.createdAt).toDateString()}`,
					'inline': true,
				},
				{
					'name': 'Nickname',
					'value': `${memtarget.nickname || 'none'}`,
					'inline': true,
				},
				{
					'name': `Joined ${msg.guild}:`,
					'value': `On ${new Date(memtarget.joinedAt).toDateString()}`,
				},
			],
		};
		msg.channel.send({ 'embed': embed });
	},
};