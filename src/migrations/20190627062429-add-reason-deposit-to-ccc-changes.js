"use strict";

const TABLE_NAME = "CCCChanges";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await Promise.all([
            queryInterface.removeIndex(TABLE_NAME, "ccc_changes_unique_index2"),
            queryInterface.removeConstraint(
                TABLE_NAME,
                "ccc_changes_change_constraint"
            ),
            queryInterface.removeConstraint(
                TABLE_NAME,
                "ccc_changes_transaction_hash_constraint"
            ),
            queryInterface.removeConstraint(
                TABLE_NAME,
                "ccc_changes_block_number_constraint"
            )
        ]);
        await queryInterface.sequelize.query(
            `ALTER TYPE "enum_CCCChanges_reason" ADD VALUE 'deposit' AFTER 'initial_distribution'`
        );
        await Promise.all([
            queryInterface.addIndex(
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
                            "deposit"
                        ]
                    }
                }
            ),
            queryInterface.addConstraint(TABLE_NAME, ["change"], {
                type: "check",
                name: "ccc_changes_change_constraint",
                where: {
                    [Sequelize.Op.or]: [
                        {
                            reason: ["fee"],
                            change: { [Sequelize.Op.lt]: 0 }
                        },
                        {
                            reason: ["author", "stake", "initial_distribution"],
                            change: { [Sequelize.Op.gt]: 0 }
                        },
                        {
                            reason: ["deposit"],
                            change: { [Sequelize.Op.ne]: 0 }
                        },
                        {
                            reason: ["tx"]
                        }
                    ]
                }
            }),
            queryInterface.addConstraint(TABLE_NAME, ["transactionHash"], {
                type: "check",
                name: "ccc_changes_transaction_hash_constraint",
                where: {
                    [Sequelize.Op.or]: [
                        {
                            reason: [
                                "author",
                                "stake",
                                "initial_distribution",
                                "deposit"
                            ],
                            transactionHash: { [Sequelize.Op.eq]: null }
                        },
                        {
                            reason: ["fee", "tx", "deposit"],
                            transactionHash: { [Sequelize.Op.ne]: null }
                        }
                    ]
                }
            }),
            queryInterface.addConstraint(TABLE_NAME, ["blockNumber"], {
                type: "check",
                name: "ccc_changes_block_number_constraint",
                where: {
                    [Sequelize.Op.or]: [
                        {
                            reason: ["initial_distribution"],
                            blockNumber: { [Sequelize.Op.eq]: 0 }
                        },
                        {
                            reason: ["author", "stake", "fee", "tx", "deposit"],
                            blockNumber: { [Sequelize.Op.gt]: 0 }
                        }
                    ]
                }
            })
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        await Promise.all([
            queryInterface.removeIndex(TABLE_NAME, "ccc_changes_unique_index"),
            queryInterface.removeIndex(TABLE_NAME, "ccc_changes_unique_index2"),
            queryInterface.removeConstraint(
                TABLE_NAME,
                "ccc_changes_change_constraint"
            ),
            queryInterface.removeConstraint(
                TABLE_NAME,
                "ccc_changes_transaction_hash_constraint"
            ),
            queryInterface.removeConstraint(
                TABLE_NAME,
                "ccc_changes_block_number_constraint"
            )
        ]);

        await queryInterface.sequelize.query(
            `ALTER TYPE "enum_CCCChanges_reason" RENAME TO "enum_CCCChanges_reason_tmp"`
        );
        await queryInterface.sequelize.query(
            `CREATE TYPE "enum_CCCChanges_reason" AS ENUM ('fee', 'author', 'stake', 'tx', 'initial_distribution')`
        );
        await queryInterface.sequelize.query(
            `ALTER TABLE "${TABLE_NAME}" ALTER "reason" TYPE "enum_CCCChanges_reason" USING "reason"::text::"enum_CCCChanges_reason"`
        );
        await queryInterface.sequelize.query(
            `DROP TYPE "enum_CCCChanges_reason_tmp"`
        );

        return Promise.all([
            queryInterface.addIndex(
                TABLE_NAME,
                ["address", "blockNumber", "reason", "transactionHash"],
                {
                    name: "ccc_changes_unique_index",
                    unique: true
                }
            ),
            queryInterface.addIndex(
                TABLE_NAME,
                ["address", "blockNumber", "reason"],
                {
                    unique: true,
                    name: "ccc_changes_unique_index2",
                    where: {
                        reason: ["author", "stake", "initial_distribution"]
                    }
                }
            ),
            queryInterface.addConstraint(TABLE_NAME, ["change"], {
                type: "check",
                name: "ccc_changes_change_constraint",
                where: {
                    [Sequelize.Op.or]: [
                        {
                            reason: ["fee"],
                            change: { [Sequelize.Op.lt]: 0 }
                        },
                        {
                            reason: ["author", "stake", "initial_distribution"],
                            change: { [Sequelize.Op.gt]: 0 }
                        },
                        {
                            reason: ["tx"]
                        }
                    ]
                }
            }),
            queryInterface.addConstraint(TABLE_NAME, ["transactionHash"], {
                type: "check",
                name: "ccc_changes_transaction_hash_constraint",
                where: {
                    [Sequelize.Op.or]: [
                        {
                            reason: ["author", "stake", "initial_distribution"],
                            transactionHash: { [Sequelize.Op.eq]: null }
                        },
                        {
                            reason: ["fee", "tx"],
                            transactionHash: { [Sequelize.Op.ne]: null }
                        }
                    ]
                }
            }),
            queryInterface.addConstraint(TABLE_NAME, ["blockNumber"], {
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
            })
        ]);
    }
};
