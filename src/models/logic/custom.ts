import { CustomInstance } from "../custom";
import models from "../index";

export async function createCustom(
    transactionHash: string,
    handlerId: number,
    content: string
): Promise<CustomInstance> {
    return await models.Custom.create({
        transactionHash,
        handlerId,
        content
    });
}
