"use strict";

const tableName = "AddressLogs";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex(tableName, [
            "address",
            "blockNumber",
            "transactionIndex"
        ]);
        await queryInterface.removeIndex(tableName, ["address"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex(tableName, ["address"]);
        await queryInterface.removeIndex(tableName, [
            "address",
            "blockNumber",
            "transactionIndex"
        ]);
    }
};
