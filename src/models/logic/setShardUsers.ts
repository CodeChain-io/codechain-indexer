import models from "../index";
import { SetShardUsersInstance } from "../setShardUsers";

export async function createSetShardUsers(
    transactionHash: string,
    shardId: number,
    users: string[]
): Promise<SetShardUsersInstance> {
    return await models.SetShardUsers.create({
        transactionHash,
        shardId,
        users
    });
}
