import models from "../index";
import { StoreInstance } from "../store";

export async function createStore(
    transactionHash: string,
    content: string,
    certifier: string,
    signature: string
): Promise<StoreInstance> {
    return await models.Store.create({
        transactionHash,
        content,
        certifier,
        signature
    });
}
