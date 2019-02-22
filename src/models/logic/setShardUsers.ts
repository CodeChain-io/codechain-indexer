import models from "../index";
import { SetShardUsersInstance } from "../setShardUsers";
import { strip0xPrefix } from "./utils/format";

export async function createSetShardUsers(
    transactionHash: string,
    shardId: number,
    users: string[]
): Promise<SetShardUsersInstance> {
    return await models.SetShardUsers.create({
        transactionHash: strip0xPrefix(transactionHash),
        shardId,
        users
    });
}
