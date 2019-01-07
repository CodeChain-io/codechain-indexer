"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("AssetTransferOutputs", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            actionId: {
                allowNull: false,
                type: Sequelize.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: "Actions",
                    key: "id"
                }
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
            amount: {
                allowNull: false,
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
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
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("AssetTransferOutputs");
    }
};
