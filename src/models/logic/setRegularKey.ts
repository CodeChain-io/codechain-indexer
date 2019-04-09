import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { SetRegularKeyActionJSON } from "codechain-sdk/lib/core/transaction/SetRegularKey";
import { Transaction } from "sequelize";
import models from "../index";
import { SetRegularKeyInstance } from "../setRegularKey";
import { strip0xPrefix } from "./utils/format";

export async function createSetRegularKey(
    transaction: SignedTransaction,
    options: { transaction?: Transaction } = {}
): Promise<SetRegularKeyInstance> {
    const transactionHash = transaction.hash().value;
    const { key } = transaction.toJSON().action as SetRegularKeyActionJSON;
    return await models.SetRegularKey.create(
        {
            transactionHash: strip0xPrefix(transactionHash),
            key: strip0xPrefix(key)
        },
        { transaction: options.transaction }
    );
}
