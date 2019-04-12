"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn("Blocks", "transactionsCountByType", {
            type: Sequelize.JSONB,
            defaultValue: null
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn("Blocks", "transactionsCountByType");
    }
};
