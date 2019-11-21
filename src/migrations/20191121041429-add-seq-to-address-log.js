"use strict";

const tableName = "AddressLogs";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn(tableName, "seq", {
            type: Sequelize.INTEGER
        });
        await queryInterface.addIndex(
            tableName,
            ["isPending", "address", "type", "seq"],
            {
                where: {
                    type: "TransactionSigner"
                }
            }
        );

        await queryInterface.sequelize.query(
            `UPDATE "AddressLogs"
                SET "seq" = (SELECT "Transactions"."seq" FROM "Transactions" WHERE hash="AddressLogs"."transactionHash")
                WHERE type='TransactionSigner'`
        );
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex(
            tableName,
            ["isPending", "address", "type", "seq"],
            {
                where: {
                    type: "TransactionSigner"
                }
            }
        );
        await queryInterface.removeColumn(tableName, "seq");
    }
};
