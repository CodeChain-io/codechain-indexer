"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("AssetSchemes", {
            transactionHash: {
                allowNull: false,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            assetType: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING
            },
            shardId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            metadata: {
                allowNull: false,
                type: Sequelize.TEXT
            },
            approver: {
                type: Sequelize.STRING
            },
            administrator: {
                type: Sequelize.STRING
            },
            allowedScriptHashes: {
                allowNull: false,
                type: Sequelize.JSONB
            },

            supply: {
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
            },
            networkId: {
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
        return queryInterface.dropTable("AssetSchemes", { force: true });
    }
};
