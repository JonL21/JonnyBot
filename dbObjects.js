// This file defines where Sequelize tables belong

const Sequelize = require('sequelize');
// Setup
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

// Importing models
const Users = sequelize.import('models/Users');
const Fish = sequelize.import('models/Fish');
const UserItems = sequelize.import('models/UserItems');

// Designate the items that users own under UserItems as from the Fish model
UserItems.belongsTo(Fish, { foreignKey: 'item_id', as: 'item' });

// Define a function that allows adding items from Fish to UserItems
Users.prototype.addItem = async function(item) {
	const userItem = await UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});

	if (userItem) {
		userItem.amount += 1;
		return userItem.save();
	}

	return UserItems.create({ user_id: this.user_id, item_id: item.id, amount: 1 });
};

// Define a function that removes one (1) if an item from a user's inventory
Users.prototype.removeItem = async function(item) {
	const userItem = await UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});

	if (userItem) {
		if (userItem.amount == 0) await UserItems.destroy({ where: { id: item.id } });
		userItem.amount -= 1;
		return userItem.save();
	}
};

// Define a function that removes all of an item
Users.prototype.removeAll = async function(item) {
	const userItem = await UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});

	if (userItem) {
		await UserItems.destroy({ where: { user_id: this.user_id, item_id: item.id } });
		return userItem.save();
	}
};

// Define a function that returns a collection of the user's inv
Users.prototype.getItems = function() {
	return UserItems.findAll({
		where: { user_id: this.user_id },
		include: ['item'],
	});
};

module.exports = { Users, Fish, UserItems };