"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("UTXOs", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            address: {
                allowNull: false,
                type: Sequelize.STRING
            },
            assetType: {
                allowNull: false,
                type: Sequelize.STRING
            },
            lockScriptHash: {
                allowNull: false,
                type: Sequelize.STRING
            },
            parameters: {
                allowNull: false,
                type: Sequelize.JSONB
            },
            amount: {
                allowNull: false,
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
            },
            transactionHash: {
                allowNull: false,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            transactionOutputIndex: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            assetScheme: {
                allowNull: false,
                type: Sequelize.JSONB
            },
            usedTransactionHash: {
                type: Sequelize.STRING,
                onDelete: "SET NULL",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            blockNumber: {
                allowNull: false,
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
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("UTXOs");
    }
};
