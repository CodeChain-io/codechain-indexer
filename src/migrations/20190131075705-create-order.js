"use strict";
const tableName = "Orders";
module.exports = {
    up: (queryInterface, DataTypes) => {
        return queryInterface.createTable("Orders", {
            orderHash: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING
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
            assetTypeFrom: {
                allowNull: false,
                type: DataTypes.STRING
            },
            assetTypeTo: {
                allowNull: false,
                type: DataTypes.STRING
            },
            assetTypeFee: {
                allowNull: false,
                type: DataTypes.STRING
            },
            shardIdFrom: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            shardIdTo: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            shardIdFee: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            assetQuantityFrom: {
                allowNull: false,
                type: DataTypes.STRING
            },
            assetQuantityTo: {
                allowNull: false,
                type: DataTypes.STRING
            },
            assetQuantityFee: {
                allowNull: false,
                type: DataTypes.STRING
            },
            originOutputs: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            expiration: {
                allowNull: false,
                type: DataTypes.STRING
            },
            lockScriptHashFrom: {
                allowNull: false,
                type: DataTypes.STRING
            },
            paramtersFrom: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            lockScriptHashFee: {
                allowNull: false,
                type: DataTypes.STRING
            },
            parametersFee: {
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
