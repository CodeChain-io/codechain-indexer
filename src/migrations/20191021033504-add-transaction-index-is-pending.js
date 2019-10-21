"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex("Transactions", ["isPending"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("Transactions", ["isPending"]);
    }
};
