import models from "../index";
import { SetRegularKeyInstance } from "../setRegularKey";

export async function createSetRegularKey(
    transactionHash: string,
    key: string
): Promise<SetRegularKeyInstance> {
    return await models.SetRegularKey.create({
        transactionHash,
        key
    });
}
