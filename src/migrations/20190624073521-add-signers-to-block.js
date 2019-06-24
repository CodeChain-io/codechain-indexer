"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn("Blocks", "missedSignersOfPrev", {
            type: Sequelize.ARRAY(Sequelize.TEXT),
            defaultValue: []
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn("Blocks", "missedSignersOfPrev");
    }
};
