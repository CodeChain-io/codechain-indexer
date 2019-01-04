"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("Parcels", {
            hash: {
                primaryKey: true,
                allowNull: false,
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
            parcelIndex: {
                type: Sequelize.INTEGER
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
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("Parcels");
    }
};
