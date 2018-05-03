const { developerID } = require('../config.json');

module.exports = {
	name: 'purge',
	aliases: ['prune', 'delete'],
	category: 'utility',
	cooldown: 10,
	description: 'Delete up to 100 messages in a channel',
	usage: '[Number of messages to delete]',

	execute(msg, args, uv, cli) {
		if (msg.author.id != developerID) return;
		cli.logCall(this.name, msg);
		if (isNaN(args[0])) return msg.reply('**please give a number.**').then(sentMsg => sentMsg.delete(6000));
		else if (args[0] <= 1 || args >= 99) return msg.reply('**give a number *between* 1 and 99.**').then(sentMsg => sentMsg.delete(6000));
		msg.channel.bulkDelete(args[0] + 1).catch(err => console.error(err));
	},
};