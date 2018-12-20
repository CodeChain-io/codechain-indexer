"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("Transactions", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            actionId: {
                allowNull: false,
                type: Sequelize.BIGINT,
                onDelete: "CASCADE",
                references: {
                    model: "Actions",
                    key: "id"
                }
            },
            networkId: {
                type: Sequelize.STRING
            },
            shardId: {
                type: Sequelize.INTEGER
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
            hash: {
                allowNull: false,
                type: Sequelize.STRING
            },
            timestamp: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            assetName: {
                type: Sequelize.STRING
            },
            parcelHash: {
                allowNull: false,
                type: Sequelize.STRING
            },
            blockNumber: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            parcelIndex: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            invoice: {
                type: Sequelize.BOOLEAN
            },
            errorType: {
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
        return queryInterface.dropTable("Transactions");
    }
};
