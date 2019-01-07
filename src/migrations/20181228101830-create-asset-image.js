"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("AssetImages", {
            assetSchemeId: {
                primaryKey: true,
                allowNull: false,
                type: Sequelize.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: "AssetSchemes",
                    key: "id"
                }
            },
            assetType: {
                allowNull: false,
                type: Sequelize.STRING
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
