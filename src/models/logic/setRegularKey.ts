import models from "../index";
import { SetRegularKeyInstance } from "../setRegularKey";
import { strip0xPrefix } from "./utils/format";

export async function createSetRegularKey(
    transactionHash: string,
    key: string
): Promise<SetRegularKeyInstance> {
    return await models.SetRegularKey.create({
        transactionHash: strip0xPrefix(transactionHash),
        key: strip0xPrefix(key)
    });
}
