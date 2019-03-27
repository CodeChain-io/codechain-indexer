"use strict";
const tableName = "AddressLogs";
module.exports = {
    up: (queryInterface, DataTypes) => {
        return queryInterface
            .createTable(tableName, {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: DataTypes.BIGINT
                },
                transactionHash: {
                    allowNull: false,
                    type: DataTypes.STRING,
                    onDelete: "CASCADE",
                    references: {
                        model: "Transactions",
                        key: "hash"
                    }
                },
                transactionType: {
                    allowNull: false,
                    type: DataTypes.STRING
                },
                transactionTracker: {
                    type: DataTypes.STRING
                },
                blockNumber: {
                    type: DataTypes.INTEGER
                },
                transactionIndex: {
                    type: DataTypes.INTEGER
                },
                success: {
                    type: DataTypes.BOOLEAN
                },
                isPending: {
                    allowNull: false,
                    type: DataTypes.BOOLEAN
                },
                address: {
                    allowNull: false,
                    type: DataTypes.STRING
                },
                type: {
                    allowNull: false,
                    type: DataTypes.STRING
                },
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE
                }
            })
            .then(() => queryInterface.addIndex(tableName, ["transactionHash"]))
            .then(() => queryInterface.addIndex(tableName, ["address"]));
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName, { force: true });
    }
};
