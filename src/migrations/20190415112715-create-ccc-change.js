"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        const TABLE_NAME = "CCCChanges";
        return queryInterface
            .createTable(TABLE_NAME, {
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
                change: {
                    allowNull: false,
                    type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
                },
                blockNumber: {
                    allowNull: false,
                    type: Sequelize.INTEGER,
                    onDelete: "CASCADE",
                    references: {
                        model: "Blocks",
                        key: "number"
                    }
                },
                reason: {
                    allowNull: false,
                    type: Sequelize.ENUM(
                        "fee",
                        "author",
                        "stake",
                        "tx",
                        "initial_distribution"
                    )
                },
                transactionHash: {
                    allowNull: true,
                    type: Sequelize.STRING,
                    onDelete: "CASCADE",
                    references: {
                        model: "Transactions",
                        key: "hash"
                    }
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
            .then(() => {
                const unique = queryInterface.addIndex(
                    TABLE_NAME,
                    ["address", "blockNumber", "reason", "transactionHash"],
                    { name: "ccc_changes_unique_index", unique: true }
                );
                const unique2 = queryInterface.addIndex(
                    TABLE_NAME,
                    ["address", "blockNumber", "reason"],
                    {
                        unique: true,
                        name: "ccc_changes_unique_index2",
                        where: {
                            reason: ["author", "stake", "initial_distribution"]
                        }
                    }
                );
                const changeConstraint = queryInterface.addConstraint(
                    TABLE_NAME,
                    ["change"],
                    {
                        type: "check",
                        name: "ccc_changes_change_constraint",
                        where: {
                            [Sequelize.Op.or]: [
                                {
                                    reason: ["fee"],
                                    change: { [Sequelize.Op.lt]: 0 }
                                },
                                {
                                    reason: [
                                        "author",
                                        "stake",
                                        "initial_distribution"
                                    ],
                                    change: { [Sequelize.Op.gt]: 0 }
                                },
                                {
                                    reason: ["tx"]
                                }
                            ]
                        }
                    }
                );
                const transactionHashConstraint = queryInterface.addConstraint(
                    TABLE_NAME,
                    ["transactionHash"],
                    {
                        type: "check",
                        name: "ccc_changes_transaction_hash_constraint",
                        where: {
                            [Sequelize.Op.or]: [
                                {
                                    reason: [
                                        "author",
                                        "stake",
                                        "initial_distribution"
                                    ],
                                    transactionHash: { [Sequelize.Op.eq]: null }
                                },
                                {
                                    reason: ["fee", "tx"],
                                    transactionHash: { [Sequelize.Op.ne]: null }
                                }
                            ]
                        }
                    }
                );
                const blockNumberConstraint = queryInterface.addConstraint(
                    TABLE_NAME,
                    ["blockNumber"],
                    {
                        type: "check",
                        name: "ccc_changes_block_number_constraint",
                        where: {
                            [Sequelize.Op.or]: [
                                {
                                    reason: ["initial_distribution"],
                                    blockNumber: { [Sequelize.Op.eq]: 0 }
                                },
                                {
                                    reason: ["author", "stake", "fee", "tx"],
                                    blockNumber: { [Sequelize.Op.gt]: 0 }
                                }
                            ]
                        }
                    }
                );
                const blockNumber = queryInterface.addIndex(
                    TABLE_NAME,
                    ["blockNumber"],
                    { name: "ccc_changes_block_number", unique: false }
                );
                const address = queryInterface.addIndex(
                    TABLE_NAME,
                    ["address"],
                    { name: "ccc_changes_address", unique: false }
                );
                const transactionHash = queryInterface.addIndex(
                    TABLE_NAME,
                    ["transactionHash"],
                    { name: "ccc_changes_transaction_hash", unique: false }
                );
                return Promise.all([
                    unique,
                    unique2,
                    changeConstraint,
                    transactionHashConstraint,
                    blockNumberConstraint,
                    blockNumber,
                    address,
                    transactionHash
                ]);
            });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface
            .dropTable("CCCChanges", { force: true })
            .then(() =>
                queryInterface.sequelize.query(
                    `drop type "enum_CCCChanges_reason"`
                )
            );
    }
};
