"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("AssetImages", {
            transactionHash: {
                allowNull: false,
                type: Sequelize.STRING
            },
            assetType: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "AssetSchemes",
                    key: "assetType"
                }
            },
            image: {
                allowNull: false,
                type: Sequelize.BLOB
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
        return queryInterface.dropTable("AssetImages", { force: true });
    }
};
