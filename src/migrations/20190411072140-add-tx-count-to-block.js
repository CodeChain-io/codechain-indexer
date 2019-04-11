"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn("Blocks", "transactionsCount", {
            type: Sequelize.INTEGER,
            defaultValue: null
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn("Blocks", "transactionsCount");
    }
};
