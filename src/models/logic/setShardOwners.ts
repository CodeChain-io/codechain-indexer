import models from "../index";
import { SetShardOwnersInstance } from "../setShardOwners";
import { strip0xPrefix } from "./utils/format";

export async function createSetShardOwners(
    transactionHash: string,
    shardId: number,
    owners: string[]
): Promise<SetShardOwnersInstance> {
    return await models.SetShardOwners.create({
        transactionHash: strip0xPrefix(transactionHash),
        shardId,
        owners
    });
}
