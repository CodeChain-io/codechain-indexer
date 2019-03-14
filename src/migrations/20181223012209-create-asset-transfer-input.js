"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        // FIXMD: This code is duplicated with asset transfer burn, decompose input
        return queryInterface.createTable("AssetTransferInputs", {
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
            prevOut: {
                allowNull: false,
                type: Sequelize.JSONB
            },
            index: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            owner: {
                type: Sequelize.STRING
            },
            assetType: {
                allowNull: false,
                type: Sequelize.STRING
            },
            shardId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            timelock: {
                type: Sequelize.JSONB
            },
            lockScript: {
                allowNull: false,
                type: Sequelize.JSONB
            },
            unlockScript: {
                allowNull: false,
                type: Sequelize.JSONB
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
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("AssetTransferInputs", { force: true });
    }
};
