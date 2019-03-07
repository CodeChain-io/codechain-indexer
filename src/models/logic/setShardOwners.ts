import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { SetShardOwnersActionJSON } from "codechain-sdk/lib/core/transaction/SetShardOwners";
import models from "../index";
import { SetShardOwnersInstance } from "../setShardOwners";
import { strip0xPrefix } from "./utils/format";

export async function createSetShardOwners(
    transaction: SignedTransaction
): Promise<SetShardOwnersInstance> {
    const transactionHash = transaction.hash().value;
    const { shardId, owners } = transaction.toJSON()
        .action as SetShardOwnersActionJSON;
    return await models.SetShardOwners.create({
        transactionHash: strip0xPrefix(transactionHash),
        shardId,
        owners
    });
}
