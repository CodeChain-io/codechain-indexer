import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import models from "..";
import { AssetTypeLogInstance } from "../assetTypeLog";
import { strip0xPrefix } from "./utils/format";
import { getTracker } from "./utils/transaction";

export async function createAssetTypeLog(
    transaction: SignedTransaction,
    assetType: string
): Promise<AssetTypeLogInstance> {
    return models.AssetTypeLog.create({
        transactionHash: transaction.hash().value,
        transactionTracker: getTracker(transaction),
        transactionType: transaction.unsigned.type(),
        blockNumber: transaction.blockNumber,
        transactionIndex: transaction.transactionIndex,
        success: transaction.result,
        isPending: transaction.result == null,
        assetType: strip0xPrefix(assetType)
    });
}
