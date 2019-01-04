"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("Transactions", {
            hash: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING
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
            output: {
                type: Sequelize.JSONB
            },
            burns: {
                type: Sequelize.JSONB
            },
            input: {
                type: Sequelize.JSONB
            },
            inputs: {
                type: Sequelize.JSONB
            },
            outputs: {
                type: Sequelize.JSONB
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
            timestamp: {
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
                type: Sequelize.INTEGER
            },
            parcelIndex: {
                type: Sequelize.INTEGER
            },
            invoice: {
                type: Sequelize.BOOLEAN
            },
            errorType: {
                type: Sequelize.STRING
            },
            isPending: {
                allowNull: false,
                type: Sequelize.BOOLEAN
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
