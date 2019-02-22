import { CustomInstance } from "../custom";
import models from "../index";
import { strip0xPrefix } from "./utils/format";

export async function createCustom(
    transactionHash: string,
    handlerId: number,
    content: string
): Promise<CustomInstance> {
    return await models.Custom.create({
        transactionHash: strip0xPrefix(transactionHash),
        handlerId,
        content
    });
}
