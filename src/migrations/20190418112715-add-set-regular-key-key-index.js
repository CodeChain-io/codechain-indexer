"use strict";

const TABLE_NAME = "SetRegularKeys";
const ATTRIBUTES = ["key"];
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addIndex(TABLE_NAME, ATTRIBUTES, {
            unique: false
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.removeIndex(TABLE_NAME, ATTRIBUTES, {
            force: true
        });
    }
};
