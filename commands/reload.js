const { developerID } = require('../config.json');

module.exports = {
	name: 'reload',
	aliases: ['r'],
	category: 'utility',
	description: 'Update one or all commands for any changes',
	developerOnly: true,
	usage: '{command}',

	execute(msg, args, uv, client) {
		if (msg.author.id != developerID) return;
		client.logCall(this.name, msg);
		if (args[0] && (args[0].startsWith('tag:') || args[0].startsWith('category:'))) {
			const arg = args[0].split(':');
			const commands = client.commands.findAll('category', arg[1]); // Find commands that match this category
			if (!commands) msg.reply('please enter a **valid command**.');
			else commands.forEach(cmd => client.load(cmd));
			msg.channel.send(`**All commands in the \`${commands[0].category}\` category were reloaded.**`);
		}
		else if (args[0]) {
			const arg = args.shift().toLowerCase();
			const command = client.commands.get(arg)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(arg)); // Find command or alias that matches this arg
			if (!command) msg.reply('please enter a **valid command**.');
			else client.load(command);
			msg.channel.send(`**The command \`${command.name}\` was reloaded.**`);
		}
		else {
			client.load();
			msg.channel.send('**All commands were reloaded.**');
		}
	},
};