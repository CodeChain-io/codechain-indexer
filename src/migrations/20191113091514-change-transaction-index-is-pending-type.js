"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("Transactions", ["isPending"]);
        await queryInterface.addIndex("Transactions", [
            "isPending",
            "type",
            "blockNumber",
            "transactionIndex"
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("Transactions", [
            "isPending",
            "type",
            "blockNumber",
            "transactionIndex"
        ]);
        await queryInterface.addIndex("Transactions", ["isPending"]);
    }
};
