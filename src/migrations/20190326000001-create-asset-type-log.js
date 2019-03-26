"use strict";
const tableName = "AssetTypeLogs";
module.exports = {
    up: (queryInterface, DataTypes) => {
        return queryInterface.createTable(tableName, {
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
            assetType: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{40}$"]
                }
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
        return queryInterface.dropTable(tableName, { force: true });
    }
};
