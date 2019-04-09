import { SignedTransaction, U64 } from "codechain-sdk/lib/core/classes";
import { PayActionJSON } from "codechain-sdk/lib/core/transaction/Pay";
import { Transaction } from "sequelize";
import models from "../index";
import { PayInstance } from "../pay";
import { createAddressLog } from "./addressLog";
import { strip0xPrefix } from "./utils/format";

export async function createPay(
    transaction: SignedTransaction,
    options: { transaction?: Transaction } = {}
): Promise<PayInstance> {
    const transactionHash = transaction.hash().value;
    const { quantity, receiver } = transaction.toJSON().action as PayActionJSON;
    const instance = await models.Pay.create(
        {
            transactionHash: strip0xPrefix(transactionHash),
            quantity: new U64(quantity).toString(),
            receiver
        },
        { transaction: options.transaction }
    );
    await createAddressLog(transaction, receiver, "AssetOwner", options);
    return instance;
}
