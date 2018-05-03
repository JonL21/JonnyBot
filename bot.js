const fs = require('fs'); // Reading files
const Discord = require('discord.js'); // This bot uses discord.js
const { token, prefix, developerID } = require('./config.json'); // Obtain bot token and bot prefix

const client = new Discord.Client();

// Define a function 'load' of client that gets one or all commands in the commands folder
client.load = command => {
	const commandsList = fs.readdirSync('./commands/');
	if (command) {
		if (commandsList.indexOf(`${command.name}.js`) >= 0) {
			delete require.cache[require.resolve(`./commands/${command.name}.js`)];
			const cmd = require (`./commands/${command.name}.js`);
			client.commands.set(cmd.name, cmd);
		}
	}
	else {
		client.commands = new Discord.Collection();
		for (const x of commandsList) {
			if (x.match(/\.js$/)) { // Only take javascript files
				delete require.cache[require.resolve(`./commands/${x}`)];
				const cmd = require (`./commands/${x}`);
				client.commands.set(cmd.name, cmd);
			}
		}
	}
};
client.load();

// Define a function 'logCall' of client that logs when a user calls a command to the console
client.logCall = (command, msg) => {
	console.log(`${prefix}${command} called by User '${msg.author.username}' in Guild '${msg.guild}' in Channel '${msg.channel.name}'`);
};

// Music vars
client.nowPlaying = new Discord.Collection(); // For the currently played song
client.volume = new Discord.Collection(); // For the volume at which the bot plays music
client.servers = new Discord.Collection(); // For storing the queue/instances for each guild
const YTDL = require('ytdl-core'); // For downloading YT videos

// Define a function 'play' of client that plays audio from YouTube in a voice channel
client.play = (msg, cli, con) => {
	const guildID = msg.guild.id;
	const server = cli.servers.get(guildID);

	cli.nowPlaying.set(guildID, server.queue.shift());
	const video = cli.nowPlaying.get(guildID);

	const embed = {
		'description': `**Now Playing**: \n${video.title}`,
		'color': 2348939,
		'footer': {
			'icon_url': cli.user.avatarURL,
			'text': 'Music',
		},
		'thumbnail': {
			'url': video.thumbnail,
		},
	};
	msg.channel.send({ 'embed': embed });

	server.dispatcher = con.playStream(YTDL(video.url, { quality: 'highestaudio', filter: 'audioonly' }));
	if (cli.volume.get(guildID)) server.dispatcher.setVolume(cli.volume.get(guildID));

	server.dispatcher.on('end', () => {
		cli.nowPlaying.set(guildID, null);
		if (server.queue.length > 0) {
			cli.play(msg, cli, con);
		}
		else {
			con.disconnect();
			server.dispatcher = null;
		}
	});
};

const UserValues = new Discord.Collection(); // Holds user values from table
const STARTER_BAL = 1000; // What to initialize balance to for new users

// Define a function for the Collection UserValues to add money to balance
Reflect.defineProperty(UserValues, 'add', {
	value: async function add(id, amount) {
		const user = UserValues.get(id);
		if (user) {
			user.balance += Number(amount);
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, balance: STARTER_BAL, last: 0 });
		UserValues.set(id, newUser);
		return newUser;
	},
});

// Define a function for the Collection UserValues to get balances
Reflect.defineProperty(UserValues, 'getBalance', {
	value: function getBalance(id) {
		const user = UserValues.get(id);
		return user ? user.balance : 0;
	},
});

Reflect.defineProperty(UserValues, 'getLastRedeemed', {
	value: function getLastRedeemed(id) {
		const user = UserValues.get(id);
		return user ? user.last : 0;
	},
});

Reflect.defineProperty(UserValues, 'setLastRedeemed', {
	value: async function setLastRedeemed(id, amount) {
		const user = UserValues.get(id);
		if (user) {
			user.last = Number(amount);
			return user.save();
		}
	},
});

client.once('ready', async () => {
	// Get all player balances stored in database
	(await Users.findAll()).forEach(b => UserValues.set(b.user_id, b));

	console.log(`Logged in as ${client.user.tag}`);
	client.user.setActivity(`In ${client.guilds.size} Guilds`);

	// Enable lottery
	setInterval(() => {
		client.commands.get('lottery').endLot(client, UserValues);
	}, client.commands.get('lottery').length);
});

const cooldowns = new Discord.Collection(); // Command cooldowns
const { Users } = require('./dbObjects'); // User database

client.on('message', async msg => {
	if (!msg.guild || !msg.content.startsWith(prefix) || msg.author.bot) return; // Ignore msgs: in DMs, that do not begin with prefix, are from bots

	var args = msg.content.slice(prefix.length).trim().split(/ +/g); // Get all arguments from msg
	var cName = args.shift().toLowerCase(); // Take first arg
	const command = client.commands.get(cName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cName)); // Find command or alias that matches this arg

	// Return if command does not exist or requires additional arguments or has any other flags
	if (!command) return;
	else if (command.args && !args.length) return msg.reply(`**Usage**: \`${prefix}${command.name} ${command.usage}\``);
	else if (command.developerOnly && msg.author.id != developerID) return msg.reply('this command is for developers only!');

	// Create a collection for cooldowns of this command (if not already made)
	if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Discord.Collection());

	const now = new Date(); // Get current time
	const timestamps = cooldowns.get(command.name); // Get user cooldowns of commmand
	const cdAmt = (command.cooldown || 3) * 1000; // Get cooldown of command, otherwise 3s if not given

	// If user called !free:
	if (command.name == 'free') {
		const pastFree = UserValues.getLastRedeemed(msg.author.id);
		if (now < pastFree) {
			const timeLeft = new Date(pastFree - now);
			return msg.reply(`**please wait ${timeLeft.getUTCHours() == 0 ? '' : timeLeft.getUTCHours() + ' hours, '}${timeLeft.getUTCMinutes() == 0 ? '' : timeLeft.getUTCMinutes() + ' minutes, '}${timeLeft.getUTCSeconds()} seconds before getting your daily $100!**`);
		}
	}
	// Else If user isn't on cooldown for this command or is not DEVELOPER, add them to the list
	else if (!timestamps.has(msg.author.id) && msg.author.id != developerID) {
		timestamps.set(msg.author.id, now);
		setTimeout(() => timestamps.delete(msg.author.id), cdAmt); // Remove them from list after cooldown ends
	}
	// Else (if user spams command), tell them how much time is left on their cooldown
	else {
		const expirationTime = timestamps.get(msg.author.id) + cdAmt;

		if (now < expirationTime) {
			const timeLeft = new Date(expirationTime - now);
			return msg.reply(`**you're on cooldown! ${timeLeft.getSeconds()} seconds remaining.**`);
		}

		timestamps.set(msg.author.id);
		setTimeout(() => timestamps.delete(msg.author.id), cdAmt);
	}

	if (command.category === 'music') {
		if (!msg.member.voiceChannel) return msg.reply('you must be in a **voice channel** to use this command!');
		if (!client.servers.has(msg.guild.id)) {
			client.servers.set(msg.guild.id, {
				queue: [],
			});
		}
	}

	UserValues.add(msg.author.id, 1);

	try {
		command.execute(msg, args, UserValues, client);
	}
	catch (err) {
		console.error(`User '${msg.author.username}' in Guild '${msg.guild}' from Channel '${msg.channel.name}' tried calling '${command.name}'.\n${err}`);
	}
});

client.on('error', e => {
	console.error(e);
	console.log('OH NOES! WE HAZ ENCEWAWNTWURED AN ERRWOE! :3c');
});

client.on('warn', e => {
	console.error(e);
});

client.login(token);