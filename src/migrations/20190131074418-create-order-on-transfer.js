"use strict";
const tableName = "OrderOnTransfers";
module.exports = {
    up: (queryInterface, DataTypes) => {
        return queryInterface.createTable("OrderOnTransfers", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.BIGINT
            },
            transactionHash: {
                allowNull: false,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            spentQuantity: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            inputIndices: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            outputIndices: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            createdAt: {
                allowNull: false,
                type: DataTypes.DATE
            },
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};
