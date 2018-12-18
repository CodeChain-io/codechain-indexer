"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("Parcels", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            blockNumber: {
                type: Sequelize.INTEGER
            },
            blockHash: {
                type: Sequelize.STRING
            },
            parcelIndex: {
                type: Sequelize.INTEGER
            },
            seq: {
                allowNull: false,
                type: Sequelize.STRING
            },
            fee: {
                allowNull: false,
                type: Sequelize.STRING
            },
            networkId: {
                allowNull: false,
                type: Sequelize.STRING
            },
            sig: {
                allowNull: false,
                type: Sequelize.STRING
            },
            hash: {
                allowNull: false,
                type: Sequelize.STRING
            },
            signer: {
                allowNull: false,
                type: Sequelize.STRING
            },
            timestamp: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            isRetracted: {
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
        return queryInterface.dropTable("Parcels");
    }
};
