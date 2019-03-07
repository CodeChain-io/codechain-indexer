import { SDK } from "codechain-sdk";
import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { CreateShardActionJSON } from "codechain-sdk/lib/core/transaction/CreateShard";
import { CreateShardInstance } from "../createShard";
import models from "../index";
import { TransactionInstance } from "../transaction";
import { strip0xPrefix } from "./utils/format";

export async function createCreateShard(
    transaction: SignedTransaction
): Promise<CreateShardInstance> {
    const transactionHash = transaction.hash().value;
    const { users } = transaction.toJSON().action as CreateShardActionJSON;
    return await models.CreateShard.create({
        transactionHash: strip0xPrefix(transactionHash),
        users
    });
}

export async function updateShardId(tx: TransactionInstance, sdk: SDK) {
    const { hash } = tx.get();
    const shardId = await sdk.rpc.chain.getShardIdByHash(hash);
    await models.CreateShard.update(
        {
            shardId: shardId!
        },
        {
            where: {
                transactionHash: strip0xPrefix(hash)
            }
        }
    );
}
