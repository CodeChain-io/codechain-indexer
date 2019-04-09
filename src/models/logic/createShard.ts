import { SDK } from "codechain-sdk";
import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { CreateShardActionJSON } from "codechain-sdk/lib/core/transaction/CreateShard";
import { Transaction } from "sequelize";
import { CreateShardInstance } from "../createShard";
import models from "../index";
import { TransactionInstance } from "../transaction";
import { strip0xPrefix } from "./utils/format";

export async function createCreateShard(
    transaction: SignedTransaction,
    options: { transaction?: Transaction } = {}
): Promise<CreateShardInstance> {
    const transactionHash = transaction.hash().value;
    const { users } = transaction.toJSON().action as CreateShardActionJSON;
    return await models.CreateShard.create(
        {
            transactionHash: strip0xPrefix(transactionHash),
            users
        },
        { transaction: options.transaction }
    );
}

export async function updateShardId(
    tx: TransactionInstance,
    sdk: SDK,
    options: { transaction?: Transaction } = {}
) {
    const { hash } = tx.get();
    const shardId = await sdk.rpc.chain.getShardIdByHash(hash);
    await models.CreateShard.update(
        {
            shardId: shardId!
        },
        {
            where: {
                transactionHash: strip0xPrefix(hash)
            },
            transaction: options.transaction
        }
    );
}
