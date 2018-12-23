"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("UTXOs", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            address: {
                allowNull: false,
                type: Sequelize.STRING
            },
            quantity: {
                allowNull: false,
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
            },
            asset: {
                allowNull: false,
                type: Sequelize.JSONB
            },
            isUsed: {
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
        return queryInterface.dropTable("UTXOs");
    }
};
