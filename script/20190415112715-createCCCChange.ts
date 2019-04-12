import { SDK } from "codechain-sdk";
import models from "../src/models";
import { updateCCCChange } from "../src/worker/cccChange";

async function main() {
    const networkId: string = process.env.CODECHAIN_NETWORK_ID!;
    if (networkId == null) {
        throw Error("Set CODECHAIN_NETWORK_ID");
    }
    const server: string = process.env.CODECHAIN_RPC_SERVER!;
    if (server == null) {
        throw Error("Set CODECHAIN_RPC_SERVER");
    }

    const sdk = new SDK({ server, networkId });

    const cccChange = await models.CCCChange.findOne({
        order: [["blockNumber", "DESC"]]
    });
    let blockNumber = cccChange == null ? 0 : cccChange.get("blockNumber") + 1;
    console.log(`Start sync from ${blockNumber}`);

    const transaction = await models.sequelize.transaction({
        isolationLevel:
            models.Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        deferrable: models.Sequelize.Deferrable.SET_DEFERRED
    });
    try {
        while (true) {
            const blockProj = await models.Block.findOne({
                order: [["number", "DESC"]]
            });
            const bestBlock = blockProj == null ? 0 : blockProj.get("number");

            if (bestBlock <= blockNumber) {
                break;
            }
            const queries = [];
            for (; blockNumber <= bestBlock; blockNumber += 1) {
                console.log(`Synchronize ${blockNumber}`);

                const block = await sdk.rpc.chain.getBlock(blockNumber);
                if (block == null) {
                    throw Error(
                        `${blockNumber} is an invalid block number: no block`
                    );
                }
                const miningReward = await sdk.rpc.chain.getMiningReward(
                    block.number
                );
                if (miningReward == null) {
                    throw Error(
                        `${blockNumber} is an invalid block number: no mining reward`
                    );
                }
                queries.push(
                    updateCCCChange(sdk, block, miningReward, transaction)
                );
            }
            await Promise.all(queries);
        }

        await transaction.commit();
        console.log("Migration finished");
    } catch (err) {
        console.error(err);
        await transaction.rollback();
    }

    await models.sequelize.close();
}

main().catch(console.error);
