import models from "../index";
import { RemoveInstance } from "../remove";
import { strip0xPrefix } from "./utils/format";

export async function createRemove(
    transactionHash: string,
    textHash: string,
    signature: string
): Promise<RemoveInstance> {
    return await models.Remove.create({
        transactionHash: strip0xPrefix(transactionHash),
        textHash: strip0xPrefix(textHash),
        signature: strip0xPrefix(signature)
    });
}
