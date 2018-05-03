module.exports = (sequelize, DataTypes) => {
	return sequelize.define('fish', {
		name: {
			type: DataTypes.TEXT,
			unique: true,
		},
		tier: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		value: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};