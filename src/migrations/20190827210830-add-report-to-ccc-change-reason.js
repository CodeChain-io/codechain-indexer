"use strict";

const TABLE_NAME = "CCCChanges";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await Promise.all([
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
            `ALTER TYPE "enum_CCCChanges_reason" ADD VALUE 'report' AFTER 'validator'`
        );
        await Promise.all([
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
                            reason: [
                                "author",
                                "stake",
                                "initial_distribution",
                                "validator",
                                "report"
                            ],
                            change: { [Sequelize.Op.gt]: 0 }
                        },
                        {
                            reason: ["tx", "deposit"]
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
                                "deposit",
                                "validator"
                            ],
                            transactionHash: { [Sequelize.Op.eq]: null }
                        },
                        {
                            reason: ["fee", "tx", "deposit", "report"],
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
                            reason: [
                                "author",
                                "stake",
                                "fee",
                                "tx",
                                "deposit",
                                "validator",
                                "report"
                            ],
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
            `CREATE TYPE "enum_CCCChanges_reason" AS ENUM ('fee', 'author', 'stake', 'tx', 'initial_distribution', 'deposit', 'validator')`
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
                        reason: [
                            "author",
                            "stake",
                            "initial_distribution",
                            "validator"
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
                            reason: [
                                "author",
                                "stake",
                                "initial_distribution",
                                "validator"
                            ],
                            change: { [Sequelize.Op.gt]: 0 }
                        },
                        {
                            reason: ["tx", "deposit"]
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
                                "deposit",
                                "validator"
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
                            reason: [
                                "author",
                                "stake",
                                "fee",
                                "tx",
                                "deposit",
                                "validator"
                            ],
                            blockNumber: { [Sequelize.Op.gt]: 0 }
                        }
                    ]
                }
            })
        ]);
    }
};
