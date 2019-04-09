import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { StoreActionJSON } from "codechain-sdk/lib/core/transaction/Store";
import { Transaction } from "sequelize";
import models from "../index";
import { StoreInstance } from "../store";
import { strip0xPrefix } from "./utils/format";

export async function createStore(
    transaction: SignedTransaction,
    options: {
        transaction?: Transaction;
    } = {}
): Promise<StoreInstance> {
    const transactionHash = transaction.hash().value;
    const { content, certifier, signature } = transaction.toJSON()
        .action as StoreActionJSON;
    return await models.Store.create(
        {
            transactionHash: strip0xPrefix(transactionHash),
            content,
            certifier,
            signature: strip0xPrefix(signature)
        },
        { transaction: options.transaction }
    );
}
