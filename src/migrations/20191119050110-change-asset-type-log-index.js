"use strict";

const tableName = "AssetTypeLogs";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex(tableName, [
            "assetType",
            "blockNumber",
            "transactionIndex"
        ]);
        await queryInterface.removeIndex(tableName, ["assetType"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex(tableName, ["assetType"]);
        await queryInterface.removeIndex(tableName, [
            "assetType",
            "blockNumber",
            "transactionIndex"
        ]);
    }
};
