import models from "../index";
import { SetShardOwnersInstance } from "../setShardOwners";

export async function createSetShardOwners(
    transactionHash: string,
    shardId: number,
    owners: string[]
): Promise<SetShardOwnersInstance> {
    return await models.SetShardOwners.create({
        transactionHash,
        shardId,
        owners
    });
}
