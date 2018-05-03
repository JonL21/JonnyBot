const { prefix } = require('../config.json');

module.exports = {
	// Properties
	name: 'help',
	description: 'List of available commands',
	aliases: ['commands'],
	category: 'other',
	usage: '{command name}',

	// Functions
	execute(msg, args, uv, cli) {
		cli.logCall(this.name, msg);
		const { commands } = msg.client; // Get list of commands from client
		const output = []; // Fields for embed
		let embed; // Embedded messages

		if (!args.length) { // Show list of commands if no command specified
			// Get a list of command categories
			const categories = new Set();
			commands.forEach(command => { if (!categories.has(command.category) && command.category) categories.add(command.category); });

			// List the commands under each category
			Array.from(categories).sort().forEach(cat => {
				output.push({
					'name': `**${capitalize(cat)} Commands**`,
					'value': `\u200b  > ${commands.filter(c => c.category == cat).map(d => `\`${d.name}\``).join('  ')}`,
				});
			});

			output.push({
				'name': 'If you want to see more information on a specific command:',
				'value': `\`${prefix}help [command name]\``,
			});

			embed = {
				'title': '__**Available Commands**__',
				'color': 2348939,
				'footer': {
					'icon_url': cli.user.avatarURL,
					'text': '!help',
				},
				'fields': output,
			};
		}
		else {
			if (!commands.has(args[0])) return msg.channel.send('**Please enter a valid command.**'); // Return if does not not exist

			const cmd = commands.get(args[0]);

			if (cmd.embed) return msg.channel.send({ 'embed': cmd.embed }); // If command has a custom embed, output that instead

			if (cmd.aliaes) output.push({ 'name': 'Aliases:', 'value': `\`${cmd.aliases.join('` `')}\`` });
			if (cmd.usage) output.push({ 'name': 'Usage:', 'value': `\`${prefix}${cmd.name} ${cmd.usage}\`` });
			output.push({ 'name': 'Cooldown:', 'value': `${cmd.cooldown || 3} seconds` });

			embed = {
				'title': `!${cmd.name}`,
				'description': `${cmd.description}`,
				'color': 2348939,
				'footer': {
					'icon_url': cli.user.avatarURL,
					'text': `${prefix}help ${cmd.name}`,
				},
				'fields': output,
			};
		}

		msg.channel.send({ 'embed': embed, split : true }); // Splits message if exceeds limit
	},
};

// Capitalizes first letter in passed string literal
function capitalize(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}