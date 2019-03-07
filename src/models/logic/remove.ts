import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { RemoveActionJSON } from "codechain-sdk/lib/core/transaction/Remove";
import models from "../index";
import { RemoveInstance } from "../remove";
import { strip0xPrefix } from "./utils/format";

export async function createRemove(
    transaction: SignedTransaction
): Promise<RemoveInstance> {
    const transactionHash = transaction.hash().value;
    const { hash, signature } = transaction.toJSON().action as RemoveActionJSON;
    return await models.Remove.create({
        transactionHash: strip0xPrefix(transactionHash),
        textHash: strip0xPrefix(hash),
        signature: strip0xPrefix(signature)
    });
}
