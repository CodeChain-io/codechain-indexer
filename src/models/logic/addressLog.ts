import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import models from "..";
import { AddressLogInstance, AddressLogType } from "../addressLog";
import { getTracker } from "./utils/transaction";

export async function createAddressLog(
    transaction: SignedTransaction,
    address: string,
    type: AddressLogType
): Promise<AddressLogInstance> {
    return models.AddressLog.create({
        transactionHash: transaction.hash().value,
        transactionTracker: getTracker(transaction),
        transactionType: transaction.unsigned.type(),
        blockNumber: transaction.blockNumber,
        transactionIndex: transaction.transactionIndex,
        isPending: transaction.blockNumber == null,
        address,
        type
    });
}
