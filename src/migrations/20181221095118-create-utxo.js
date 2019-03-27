"use strict";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("UTXOs", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            address: {
                allowNull: false,
                type: Sequelize.STRING
            },
            assetType: {
                allowNull: false,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "AssetSchemes",
                    key: "assetType"
                }
            },
            shardId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            lockScriptHash: {
                allowNull: false,
                type: Sequelize.STRING
            },
            parameters: {
                allowNull: false,
                type: Sequelize.JSONB
            },
            quantity: {
                allowNull: false,
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
            },
            orderHash: {
                type: Sequelize.STRING
            },
            transactionHash: {
                allowNull: false,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            transactionTracker: {
                allowNull: false,
                type: Sequelize.STRING
            },
            transactionOutputIndex: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            usedTransactionHash: {
                type: Sequelize.STRING,
                onDelete: "SET NULL",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            blockNumber: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            usedBlockNumber: {
                type: Sequelize.INTEGER
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex("UTXOs", {
            fields: ["assetType", "usedBlockNumber"],
            name: "UTXOs_assetType_usedBlockNumber"
        });
        await queryInterface.addIndex("UTXOs", ["transactionHash"]);
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("UTXOs", { force: true });
    }
};
