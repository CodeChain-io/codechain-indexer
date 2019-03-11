import * as Sequelize from "sequelize";
import models from "../src/models";

async function runRemoveAfterBlockNumber() {
    const blockNumber = process.argv[2];

    console.log(
        "Remove blocks that have equal or greater than a specified number "
    );
    if (blockNumber === undefined) {
        console.error("A number required in the arguments");
        return;
    }
    await models.Block.destroy({
        where: { number: { [Sequelize.Op.gte]: blockNumber } }
    })
        .then(_ => {
            console.log("success");
            return;
        })
        .catch(_ => {
            console.log("failed");
        });

    process.exit();
}
runRemoveAfterBlockNumber();
