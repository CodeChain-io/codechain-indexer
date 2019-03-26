"use strict";
const tableName = "TransferAssets";
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

            networkId: {
                allowNull: false,
                type: DataTypes.STRING
            },
            metadata: {
                allowNull: false,
                type: DataTypes.STRING
            },
            approvals: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            expiration: {
                allowNull: true,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            inputs: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            burns: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            outputs: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            orders: {
                allowNull: false,
                type: DataTypes.JSONB
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
