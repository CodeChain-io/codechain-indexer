"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.changeColumn("Customs", "content", {
            allowNull: false,
            type: Sequelize.TEXT
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.changeColumn("Customs", "content", {
            allowNull: false,
            type: Sequelize.STRING
        });
    }
};
