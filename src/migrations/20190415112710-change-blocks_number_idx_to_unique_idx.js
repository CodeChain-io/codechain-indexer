"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface
            .removeIndex("Blocks", "blocks_number_idx")
            .then(() =>
                queryInterface.addConstraint("Blocks", ["number"], {
                    type: "unique",
                    name: "blocks_number_idx"
                })
            );
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface
            .removeConstraint("Blocks", "blocks_number_idx")
            .then(() => queryInterface.addIndex("Blocks", ["number"]));
    }
};
