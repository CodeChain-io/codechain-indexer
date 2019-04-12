import { SDK } from "codechain-sdk";

import models from "../src/models";

async function main() {
    const sdk = new SDK({ server: "http://localhost:8080", networkId: "cc" });
    const numbers = await models.Block.findAll({
        attributes: ["number"],
        where: {
            size: {
                [models.Sequelize.Op.eq]: null
            }
        }
    }).then(blocks => blocks.map(b => b.get({ plain: true }).number));

    console.log(`${numbers.length} rows to update found`);

    let updated = 0;
    for (const n of numbers) {
        await models.Block.findOne({
            where: {
                number: n
            }
        }).then(async instance => {
            if (instance == null) {
                throw Error(`Block ${n} not found`);
            }
            const block = await sdk.rpc.chain.getBlock(n);
            const size = block!.getSize();
            updated++;
            if (updated % 100 === 0) {
                console.log(updated);
            }
            return instance.update({
                size
            });
        });
    }

    console.log(`Updated ${updated} rows`);
}

main()
    .catch(console.error)
    .finally(() => models.sequelize.close());
