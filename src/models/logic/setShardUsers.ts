import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { SetShardUsersActionJSON } from "codechain-sdk/lib/core/transaction/SetShardUsers";
import models from "../index";
import { SetShardUsersInstance } from "../setShardUsers";
import { strip0xPrefix } from "./utils/format";

export async function createSetShardUsers(
    transaction: SignedTransaction
): Promise<SetShardUsersInstance> {
    const transactionHash = transaction.hash().value;
    const { shardId, users } = transaction.toJSON()
        .action as SetShardUsersActionJSON;
    return await models.SetShardUsers.create({
        transactionHash: strip0xPrefix(transactionHash),
        shardId,
        users
    });
}
