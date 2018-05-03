module.exports = {
	name: 'avatar',
	aliases: ['pfp', 'avi', 'icon'],
	category: 'other',
	description: 'Display your avatar or others\' avatars',
	usage: '{@user}',
	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		if (msg.mentions.users.size) {
			const aviList = msg.mentions.users.map(user => {
				return `${user.username}'s avatar: ${user.displayAvatarURL}`;
			});
			return msg.channel.send(aviList);
		}
		if (args.length) {
			const aviList = [];
			args.forEach(user => {
				const x = cli.users.find(u => u.username.toLowerCase().includes(user.toLowerCase()));
				if (x && !aviList.some(y => y.displayAvatarURL == x.displayAvatarURL)) aviList.push(`${x.username}'s avatar: ${x.displayAvatarURL}`);
			});
			if (aviList.length != 0) return msg.channel.send(aviList).catch(err => console.error(err));
		}
		return msg.channel.send(`${msg.author.username}'s avatar: ${msg.author.displayAvatarURL}`);
	},
};