"use strict";
const tableName = "Pays";
module.exports = {
    up: (queryInterface, DataTypes) => {
        return queryInterface.createTable(tableName, {
            transactionHash: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },

            receiver: {
                allowNull: false,
                type: DataTypes.STRING
            },
            amount: {
                allowNull: false,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },

            createdAt: {
                allowNull: false,
                type: DataTypes.DATE
            },
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};
