"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        // FIXMD: This code is duplicated with asset transfer input model.s
        return queryInterface.createTable("AssetTransferBurns", {
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
            prevOut: {
                allowNull: false,
                type: Sequelize.JSONB
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
        return queryInterface.dropTable("AssetTransferBurns");
    }
};
