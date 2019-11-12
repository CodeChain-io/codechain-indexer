"use strict";

const TABLE_NAME = "CCCChanges";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex(TABLE_NAME, "ccc_changes_address");
        await queryInterface.addIndex(
            TABLE_NAME,
            ["address", "blockNumber", "id"],
            {
                name: "ccc_changes_address_block_number_id",
                unique: true
            }
        );
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex(
            TABLE_NAME,
            "ccc_changes_address_block_number_id"
        );
        await queryInterface.addIndex(TABLE_NAME, ["address"], {
            name: "ccc_changes_address",
            unique: false
        });
    }
};
