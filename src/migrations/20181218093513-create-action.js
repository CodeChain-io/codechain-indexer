"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("Actions", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            parcelHash: {
                allowNull: false,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Parcels",
                    key: "hash"
                }
            },
            action: {
                allowNull: false,
                type: Sequelize.STRING
            },
            receiver: {
                type: Sequelize.STRING
            },
            key: {
                type: Sequelize.STRING
            },
            amount: {
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
            },
            shardId: {
                type: Sequelize.INTEGER
            },
            invoice: {
                type: Sequelize.BOOLEAN
            },
            owners: {
                type: Sequelize.JSONB
            },
            users: {
                type: Sequelize.JSONB
            },
            errorType: {
                type: Sequelize.STRING
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
        return queryInterface.dropTable("Actions");
    }
};
