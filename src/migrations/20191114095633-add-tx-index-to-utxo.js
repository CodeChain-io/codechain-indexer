"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("UTXOs", "transactionIndex", {
            type: Sequelize.INTEGER
        });

        await queryInterface.sequelize.query(
            `UPDATE "UTXOs" SET "transactionIndex" = (SELECT "Transactions"."transactionIndex" FROM "Transactions" WHERE hash="UTXOs"."transactionHash")`
        );
    },

    down: async (queryInterface, Sequelize) => {
        return queryInterface.removeColumn("UTXOs", "transactionIndex");
    }
};
