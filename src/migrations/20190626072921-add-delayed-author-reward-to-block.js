"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn("Blocks", "intermediateRewards", {
            type: Sequelize.NUMERIC({ precision: 20, scale: 0 }),
            defaultValue: "0"
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn("Blocks", "intermediateRewards");
    }
};
