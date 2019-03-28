"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface
            .createTable("Blocks", {
                hash: {
                    primaryKey: true,
                    allowNull: false,
                    type: Sequelize.STRING
                },
                parentHash: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                timestamp: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                number: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                author: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                extraData: {
                    allowNull: false,
                    type: Sequelize.JSONB
                },
                transactionsRoot: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                stateRoot: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                score: {
                    allowNull: false,
                    type: Sequelize.STRING
                },
                seal: {
                    allowNull: false,
                    type: Sequelize.JSONB
                },
                miningReward: {
                    allowNull: false,
                    type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
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
                return queryInterface.sequelize.query(
                    'CREATE INDEX blocks_number_idx on "Blocks"("number")'
                );
            })
            .then(() => {
                return queryInterface.sequelize.query(
                    'CREATE INDEX blocks_timestamp_idx on "Blocks"("timestamp")'
                );
            });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("Blocks", { force: true });
    }
};
