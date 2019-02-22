import { CreateShardInstance } from "../createShard";
import models from "../index";
import { strip0xPrefix } from "./utils/format";

export async function createCreateShard(
    transactionHash: string
): Promise<CreateShardInstance> {
    return await models.CreateShard.create({
        transactionHash: strip0xPrefix(transactionHash)
    });
}
