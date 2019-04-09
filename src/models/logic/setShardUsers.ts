import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { SetShardUsersActionJSON } from "codechain-sdk/lib/core/transaction/SetShardUsers";
import { Transaction } from "sequelize";
import models from "../index";
import { SetShardUsersInstance } from "../setShardUsers";
import { strip0xPrefix } from "./utils/format";

export async function createSetShardUsers(
    transaction: SignedTransaction,
    options: {
        transaction?: Transaction;
    } = {}
): Promise<SetShardUsersInstance> {
    const transactionHash = transaction.hash().value;
    const { shardId, users } = transaction.toJSON()
        .action as SetShardUsersActionJSON;
    return await models.SetShardUsers.create(
        {
            transactionHash: strip0xPrefix(transactionHash),
            shardId,
            users
        },
        { transaction: options.transaction }
    );
}
