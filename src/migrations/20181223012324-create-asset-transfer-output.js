"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface
            .createTable("AssetTransferOutputs", {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.BIGINT
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
                lockScriptHash: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                parameters: {
                    allowNull: false,
                    type: Sequelize.JSONB
                },
                assetType: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                shardId: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                quantity: {
                    allowNull: false,
                    type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
                },
                index: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                owner: {
                    type: Sequelize.STRING
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE
                }
            })
            .then(() =>
                queryInterface.addIndex("AssetTransferOutputs", [
                    "transactionHash"
                ])
            )
            .then(() =>
                queryInterface.addIndex("AssetTransferOutputs", [
                    "transactionTracker",
                    "index"
                ])
            );
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("AssetTransferOutputs", {
            force: true
        });
    }
};
