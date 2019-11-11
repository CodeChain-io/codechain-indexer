"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex("AddressLogs", ["blockNumber"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("AddressLogs", ["blockNumber"]);
    }
};
