import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { CustomActionJSON } from "codechain-sdk/lib/core/transaction/Custom";
import { CustomInstance } from "../custom";
import models from "../index";
import { strip0xPrefix } from "./utils/format";

export async function createCustom(
    transaction: SignedTransaction
): Promise<CustomInstance> {
    const transactionHash = transaction.hash().value;
    const { handlerId, buffer } = transaction.toJSON()
        .action as CustomActionJSON;
    const content = Buffer.from(buffer).toString("hex");
    return await models.Custom.create({
        transactionHash: strip0xPrefix(transactionHash),
        handlerId: parseInt(handlerId, 10),
        content
    });
}
