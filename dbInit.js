// THIS FILE IS RAN ONCE IN ORDER TO CREATE DB

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Fish = sequelize.import('models/Fish');
sequelize.import('models/Users');
sequelize.import('models/UserItems');

sequelize.sync().then(async () => {
	const shop = [
		Fish.upsert({ name: ':duck:', tier: '!?', value: 1 }),

		Fish.upsert({ name: ':bug:', tier: 'Trash', value: 5 }),
		Fish.upsert({ name: ':butterfly:', tier: 'Trash', value: 5 }),
		Fish.upsert({ name: ':fallen_leaf:', tier: 'Trash', value: 5 }),

		Fish.upsert({ name: ':fish:', tier: 'Ubiquitous', value: 10 }),

		Fish.upsert({ name: ':tropical_fish:', tier: 'Common', value: 20 }),

		Fish.upsert({ name: ':shrimp:', tier: 'Uncommon', value: 60 }),
		Fish.upsert({ name: ':crab:', tier: 'Uncommon', value: 60 }),
		Fish.upsert({ name: ':blowfish:', tier: 'Uncommon', value: 60 }),
		Fish.upsert({ name: ':turtle:', tier: 'Uncommon', value: 60 }),
		Fish.upsert({ name: ':squid:', tier: 'Uncommon', value: 60 }),

		Fish.upsert({ name: ':dolphin:', tier: 'Rare', value: 250 }),

		Fish.upsert({ name: ':whale:', tier: 'Elusive', value: 1000 }),
		Fish.upsert({ name: ':whale2:', tier: 'Elusive', value: 1000 }),
		Fish.upsert({ name: ':shark:', tier: 'Elusive', value: 1000 }),
	];
	await Promise.all(shop);
	console.log('Database loaded');
}).catch(console.error);