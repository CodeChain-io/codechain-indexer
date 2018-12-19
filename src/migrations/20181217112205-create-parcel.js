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
                allowNull: false,
                type: Sequelize.INTEGER
            },
            blockHash: {
                allowNull: false,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Blocks",
                    key: "hash"
                }
            },
            parcelIndex: {
                allowNull: false,
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
        return queryInterface.dropTable("Parcels");
    }
};
