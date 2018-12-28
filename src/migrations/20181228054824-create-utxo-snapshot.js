"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("UTXOSnapshots", {
            snapshotId: {
                allowNull: false,
                type: Sequelize.BIGINT,
                primaryKey: true,
                onDelete: "CASCADE",
                references: {
                    model: "SnapshotRequests",
                    key: "id"
                }
            },
            blockNumber: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            snapshot: {
                allowNull: false,
                type: Sequelize.JSONB
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
        return queryInterface.dropTable("UTXOSnapshots");
    }
};
