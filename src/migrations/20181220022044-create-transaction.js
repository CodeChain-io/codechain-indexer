"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface
            .createTable("Transactions", {
                hash: {
                    allowNull: false,
                    primaryKey: true,
                    type: Sequelize.STRING
                },
                blockNumber: {
                    type: Sequelize.INTEGER
                },
                blockHash: {
                    type: Sequelize.STRING,
                    onDelete: "CASCADE",
                    references: {
                        model: "Blocks",
                        key: "hash"
                    }
                },

                tracker: {
                    type: Sequelize.STRING
                },

                transactionIndex: {
                    type: Sequelize.INTEGER
                },
                type: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                seq: {
                    allowNull: false,
                    type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
                },
                fee: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                networkId: {
                    allowNull: false,
                    type: Sequelize.STRING
                },

                sig: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                signer: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                errorHint: {
                    type: Sequelize.TEXT("MEDIUM")
                },
                timestamp: {
                    type: Sequelize.INTEGER
                },
                isPending: {
                    allowNull: false,
                    type: Sequelize.BOOLEAN
                },
                pendingTimestamp: {
                    type: Sequelize.INTEGER
                },

                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE
                }
            })
            .then(() => queryInterface.addIndex("Transactions", ["blockHash"]))
            .then(() =>
                queryInterface.addIndex("Transactions", ["blockNumber"])
            );
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("Transactions", { force: true });
    }
};
