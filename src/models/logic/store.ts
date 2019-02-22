import models from "../index";
import { StoreInstance } from "../store";
import { strip0xPrefix } from "./utils/format";

export async function createStore(
    transactionHash: string,
    content: string,
    certifier: string,
    signature: string
): Promise<StoreInstance> {
    return await models.Store.create({
        transactionHash: strip0xPrefix(transactionHash),
        content,
        certifier,
        signature: strip0xPrefix(signature)
    });
}
