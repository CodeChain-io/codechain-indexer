import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { Transaction } from "sequelize";
import models from "..";
import { AddressLogInstance, AddressLogType } from "../addressLog";
import { getTracker } from "./utils/transaction";

export async function createAddressLog(
    transaction: SignedTransaction,
    address: string,
    type: AddressLogType,
    options: { transaction?: Transaction } = {}
): Promise<AddressLogInstance> {
    return models.AddressLog.create(
        {
            transactionHash: transaction.hash().value,
            transactionTracker: getTracker(transaction),
            transactionType: transaction.unsigned.type(),
            blockNumber: transaction.blockNumber,
            transactionIndex: transaction.transactionIndex,
            isPending: transaction.blockNumber == null,
            address,
            type
        },
        { transaction: options.transaction }
    );
}

export async function updateAddressLog(
    tx: SignedTransaction,
    options: { transaction?: Transaction } = {}
): Promise<void> {
    return models.AddressLog.update(
        {
            blockNumber: tx.blockNumber,
            transactionIndex: tx.transactionIndex,
            success: true,
            isPending: false
        },
        {
            where: {
                transactionHash: tx.hash().value
            },
            returning: false,
            transaction: options.transaction
        }
    ).then(() => {
        return;
    });
}
