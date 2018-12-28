"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("AssetImages", {
            assetType: {
                primaryKey: true,
                allowNull: false,
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
        return queryInterface.dropTable("AssetImages");
    }
};
