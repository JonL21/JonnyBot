module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.TEXT,
			primaryKey: true,
		},
		balance: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		last: {
			type: DataTypes.TEXT,
			allowNull: false,
			default: 0,
		},
	}, {
		timestamps: false,
	});
};