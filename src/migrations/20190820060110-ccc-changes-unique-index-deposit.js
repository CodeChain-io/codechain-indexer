"use strict";

const TABLE_NAME = "CCCChanges";
module.exports = {
    up: async (queryInterface, _Sequelize) => {
        await queryInterface.removeIndex(
            TABLE_NAME,
            "ccc_changes_unique_index2"
        );
        await queryInterface.addIndex(
            TABLE_NAME,
            ["address", "blockNumber", "reason"],
            {
                unique: true,
                name: "ccc_changes_unique_index2",
                where: {
                    reason: [
                        "author",
                        "stake",
                        "initial_distribution",
                        "validator"
                    ]
                }
            }
        );
    },
    down: async (queryInterface, _Sequelize) => {
        await queryInterface.removeIndex(
            TABLE_NAME,
            "ccc_changes_unique_index2"
        );
        await queryInterface.addIndex(
            TABLE_NAME,
            ["address", "blockNumber", "reason"],
            {
                unique: true,
                name: "ccc_changes_unique_index2",
                where: {
                    reason: [
                        "author",
                        "stake",
                        "initial_distribution",
                        "deposit",
                        "validator"
                    ]
                }
            }
        );
    }
};
