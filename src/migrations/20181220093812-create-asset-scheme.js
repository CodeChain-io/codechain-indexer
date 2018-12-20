"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("AssetSchemes", {
            assetType: {
                allowNull: false,
                primaryKey: true,
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
            metadata: {
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
