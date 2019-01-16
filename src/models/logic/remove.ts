import models from "../index";
import { RemoveInstance } from "../remove";

export async function createRemove(
    transactionHash: string,
    textHash: string,
    signature: string
): Promise<RemoveInstance> {
    return await models.Remove.create({
        transactionHash,
        textHash,
        signature
    });
}
