"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("AssetSchemes", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            assetType: {
                allowNull: false,
                type: Sequelize.STRING
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
            metadata: {
                allowNull: false,
                type: Sequelize.STRING
            },
            approver: {
                type: Sequelize.STRING
            },
            administrator: {
                type: Sequelize.STRING
            },
            amount: {
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
            },
            networkId: {
                type: Sequelize.STRING
            },
            shardId: {
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
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("AssetSchemes");
    }
};
