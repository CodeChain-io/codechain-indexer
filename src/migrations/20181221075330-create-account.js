"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("Accounts", {
            address: {
                primaryKey: true,
                type: Sequelize.STRING
            },
            balance: {
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
            },
            seq: {
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
        return queryInterface.dropTable("Accounts");
    }
};
