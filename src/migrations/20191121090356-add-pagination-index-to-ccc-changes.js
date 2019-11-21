"use strict";

const tableName = "CCCChanges";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex(tableName, [
            "address",
            "reason",
            "blockNumber",
            "id"
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex(tableName, [
            "address",
            "reason",
            "blockNumber",
            "id"
        ]);
    }
};
