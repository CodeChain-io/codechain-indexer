"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex("UTXOs", ["address", "id"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("UTXOs", ["address", "id"]);
    }
};
