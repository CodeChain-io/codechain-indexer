"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex("Transactions", ["tracker"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("Transactions", ["tracker"]);
    }
};
