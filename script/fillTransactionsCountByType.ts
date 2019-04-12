import { SDK } from "codechain-sdk";
import { Block } from "codechain-sdk/lib/core/Block";

import models from "../src/models";

async function main() {
    const sdk = new SDK({ server: "http://localhost:8080", networkId: "cc" });
    const numbers = await models.Block.findAll({
        attributes: ["number"],
        where: {
            transactionsCountByType: {
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
            if (block == null) {
                throw Error(`Failed to get Block ${n}`);
            }
            updated++;
            if (updated % 500 === 0) {
                console.log(updated);
            }
            return instance.update({
                transactionsCountByType: getTransactionsCountByType(block!)
            });
        });
    }

    console.log(`Updated ${updated} rows`);
}

main()
    .catch(console.error)
    .finally(() => models.sequelize.close());

function getTransactionsCountByType(block: Block) {
    const transactionsCountByType: { [type: string]: number } = {};
    block.transactions.forEach(t => {
        if (transactionsCountByType[t.unsigned.type()] == null) {
            transactionsCountByType[t.unsigned.type()] = 0;
        }
        transactionsCountByType[t.unsigned.type()] += 1;
    });
    return transactionsCountByType;
}
