"use strict";
const networkId = require("config").get("codechain.networkId");
const tableName = "AssetAddressLogs";
module.exports = {
    up: (queryInterface, DataTypes) => {
        return queryInterface
            .createTable(tableName, {
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
                    validate: {
                        is: ["^[a-f0-9]{64}$"]
                    },
                    references: {
                        model: "Transactions",
                        key: "hash"
                    }
                },
                transactionTracker: {
                    allowNull: false,
                    type: DataTypes.STRING,
                    validate: {
                        is: ["^[a-f0-9]{64}$"]
                    }
                },
                transactionType: {
                    allowNull: false,
                    type: DataTypes.STRING
                },
                blockNumber: {
                    type: DataTypes.INTEGER
                },
                transactionIndex: {
                    type: DataTypes.INTEGER
                },
                isPending: {
                    allowNull: false,
                    type: DataTypes.BOOLEAN
                },
                address: {
                    allowNull: false,
                    type: DataTypes.STRING
                },
                assetType: {
                    allowNull: false,
                    type: DataTypes.STRING,
                    validate: {
                        is: ["^[a-f0-9]{40}$"]
                    }
                },
                createdAt: {
                    allowNull: false,
                    type: DataTypes.DATE
                },
                updatedAt: {
                    allowNull: false,
                    type: DataTypes.DATE
                }
            })
            .then(() =>
                queryInterface.addIndex(tableName, {
                    fields: ["transactionHash"],
                    indexType: "Hash"
                })
            )
            .then(() =>
                queryInterface.addIndex(tableName, [
                    "address",
                    "assetType",
                    "blockNumber",
                    "transactionIndex"
                ])
            )
            .then(() =>
                queryInterface.addIndex(tableName, [
                    "address",
                    "blockNumber",
                    "transactionIndex"
                ])
            )
            .then(() =>
                queryInterface.addConstraint(
                    tableName,
                    ["transactionHash", "address", "assetType"],
                    { type: "unique" }
                )
            )
            .then(() => {
                return queryInterface.sequelize.query(`
                  INSERT INTO "${tableName}"
                    (
                      "transactionHash",
                      "transactionTracker",
                      "transactionType",
                      "blockNumber",
                      "transactionIndex",
                      "isPending",
                      "address",
                      "assetType",
                      "createdAt",
                      "updatedAt"
                    )
                    SELECT
                      "A"."transactionHash",
                      "A"."transactionTracker",
                      "A"."transactionType",
                      "A"."blockNumber",
                      "A"."transactionIndex",
                      "A"."isPending",
                      "address",
                      "assetType",
                      "A"."createdAt",
                      "A"."updatedAt"
                    FROM
                      "AddressLogs" as "A" INNER JOIN "AssetTypeLogs" as "B"
                        ON "A"."transactionHash" = "B"."transactionHash"
                    WHERE address LIKE '${networkId}a%'
                `);
            });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName, { force: true });
    }
};
