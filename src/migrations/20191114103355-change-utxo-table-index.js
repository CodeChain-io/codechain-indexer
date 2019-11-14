"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("UTXOs", "u_t_x_os_address_id");
        await queryInterface.removeIndex(
            "UTXOs",
            "UTXOs_assetType_usedBlockNumber"
        );

        await queryInterface.addIndex("UTXOs", [
            "address",
            "blockNumber",
            "transactionIndex",
            "transactionOutputIndex"
        ]);
        await queryInterface.addIndex("UTXOs", [
            "assetType",
            "blockNumber",
            "transactionIndex",
            "transactionOutputIndex"
        ]);
        await queryInterface.addIndex("UTXOs", [
            "address",
            "assetType",
            "blockNumber",
            "transactionIndex",
            "transactionOutputIndex"
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("UTXOs", [
            "address",
            "blockNumber",
            "transactionIndex",
            "transactionOutputIndex"
        ]);
        await queryInterface.removeIndex("UTXOs", [
            "assetType",
            "blockNumber",
            "transactionIndex",
            "transactionOutputIndex"
        ]);
        await queryInterface.removeIndex("UTXOs", [
            "address",
            "assetType",
            "blockNumber",
            "transactionIndex",
            "transactionOutputIndex"
        ]);
        await queryInterface.addIndex("UTXOs", ["address", "id"]);
        await queryInterface.addIndex("UTXOs", {
            fields: ["assetType", "usedBlockNumber"],
            name: "UTXOs_assetType_usedBlockNumber"
        });
    }
};
