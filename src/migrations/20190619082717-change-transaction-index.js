"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("Transactions", ["blockNumber"]);
        await queryInterface.addIndex("Transactions", [
            "blockNumber",
            "transactionIndex"
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("Transactions", [
            "blockNumber",
            "transactionIndex"
        ]);
        await queryInterface.addIndex("Transactions", ["blockNumber"]);
    }
};
