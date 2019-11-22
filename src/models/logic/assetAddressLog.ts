import * as assert from "assert";
import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { Transaction } from "sequelize";
import models from "..";
import { AssetAddressLogInstance } from "../assetAddressLog";
import { strip0xPrefix } from "./utils/format";
import { getTracker, isAssetTransactionType } from "./utils/transaction";

export async function createAssetAddressLog(
    transaction: SignedTransaction,
    address: string,
    assetType: string,
    options: { transaction?: Transaction } = {}
): Promise<AssetAddressLogInstance> {
    assert(isAssetTransactionType(transaction.unsigned.type()));
    return models.AssetAddressLog.create(
        {
            transactionHash: transaction.hash().value,
            transactionTracker: getTracker(transaction)!,
            transactionType: transaction.unsigned.type(),
            blockNumber: transaction.blockNumber,
            transactionIndex: transaction.transactionIndex,
            isPending: transaction.blockNumber == null,
            address,
            assetType: strip0xPrefix(assetType)
        },
        { transaction: options.transaction }
    );
}

export async function updateAssetAddressLog(
    transaction: SignedTransaction,
    options: { transaction?: Transaction } = {}
): Promise<void> {
    const { blockNumber, transactionIndex } = transaction;
    await models.AssetAddressLog.update(
        {
            blockNumber,
            transactionIndex,
            isPending: false
        },
        {
            where: {
                transactionHash: transaction.hash().value
            },
            returning: false,
            transaction: options.transaction
        }
    );
}
