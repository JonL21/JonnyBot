module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_item', {
		user_id: DataTypes.TEXT,
		item_id: DataTypes.TEXT,
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			default: 0,
		},
	}, {
		timestamps: false,
	});
};