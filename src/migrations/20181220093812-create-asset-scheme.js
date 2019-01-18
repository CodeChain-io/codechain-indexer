"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("AssetSchemes", {
            transactionHash: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            assetType: {
                allowNull: false,
                type: Sequelize.STRING
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
