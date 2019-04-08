"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn("AssetSchemes", "seq", {
                type: Sequelize.INTEGER,
                defaultValue: 0
            }),
            queryInterface.addColumn("IncreaseAssetSupplies", "seq", {
                type: Sequelize.INTEGER,
                defaultValue: 0
            }),
            queryInterface.addColumn("ChangeAssetSchemes", "seq", {
                type: Sequelize.INTEGER,
                defaultValue: 0
            })
        ]);
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn("AssetSchemes", "seq"),
            queryInterface.removeColumn("IncreaseAssetSupplies", "seq"),
            queryInterface.removeColumn("ChangeAssetSchemes", "seq")
        ]);
    }
};
