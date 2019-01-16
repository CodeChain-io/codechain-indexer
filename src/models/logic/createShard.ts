import { CreateShardInstance } from "../createShard";
import models from "../index";

export async function createCreateShard(
    transactionHash: string
): Promise<CreateShardInstance> {
    return await models.CreateShard.create({
        transactionHash
    });
}
