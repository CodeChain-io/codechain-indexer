import { SignedTransaction, U64 } from "codechain-sdk/lib/core/classes";
import { PayActionJSON } from "codechain-sdk/lib/core/transaction/Pay";
import models from "../index";
import { PayInstance } from "../pay";
import { strip0xPrefix } from "./utils/format";

export async function createPay(
    transaction: SignedTransaction
): Promise<PayInstance> {
    const transactionHash = transaction.hash().value;
    const { quantity, receiver } = transaction.toJSON().action as PayActionJSON;
    return await models.Pay.create({
        transactionHash: strip0xPrefix(transactionHash),
        quantity: new U64(quantity).toString(),
        receiver
    });
}
