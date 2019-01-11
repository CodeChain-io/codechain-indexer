"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("Actions", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            type: {
                allowNull: false,
                type: Sequelize.STRING
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
            approvals: {
                type: Sequelize.JSONB
            },

            assetName: {
                type: Sequelize.STRING
            },

            receiver: {
                type: Sequelize.STRING
            },
            amount: {
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
            },

            key: {
                type: Sequelize.STRING
            },

            owners: {
                type: Sequelize.JSONB
            },

            users: {
                type: Sequelize.JSONB
            },

            content: {
                type: Sequelize.STRING
            },
            certifier: {
                type: Sequelize.STRING
            },
            signature: {
                type: Sequelize.STRING
            },

            textHash: {
                type: Sequelize.STRING
            },

            handlerId: {
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
        return queryInterface.dropTable("Actions");
    }
};
