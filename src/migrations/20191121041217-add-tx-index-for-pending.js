"use strict";

const tableName = "Transactions";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex(
            tableName,
            ["isPending", "pendingTimestamp"],
            {
                where: {
                    isPending: true
                }
            }
        );
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex(
            tableName,
            ["isPending", "pendingTimestamp"],
            {
                where: {
                    isPending: true
                }
            }
        );
    }
};
