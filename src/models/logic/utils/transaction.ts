import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { AssetTransaction } from "codechain-sdk/lib/core/Transaction";
import { ChangeAssetSchemeActionJSON } from "codechain-sdk/lib/core/transaction/ChangeAssetScheme";
import { IncreaseAssetSupplyActionJSON } from "codechain-sdk/lib/core/transaction/IncreaseAssetSupply";
import { MintAssetActionJSON } from "codechain-sdk/lib/core/transaction/MintAsset";
import { TransferAssetActionJSON } from "codechain-sdk/lib/core/transaction/TransferAsset";

export function isAssetTransactionType(type: string) {
    return (
        type === "mintAsset" ||
        type === "transferAsset" ||
        type === "increaseAssetSupply" ||
        type === "changeAssetScheme" ||
        type === "wrapCCC" ||
        type === "unwrapCCC"
    );
}

export function getTracker(transaction: SignedTransaction): string | null {
    return isAssetTransactionType(transaction.unsigned.type())
        ? ((transaction.unsigned as unknown) as AssetTransaction)
              .tracker()
              .toString()
        : null;
}

export function getApprovals(transaction: SignedTransaction): string[] | null {
    const { action } = transaction.unsigned.toJSON();
    switch (action.type) {
        case "mintAsset":
            return (action as MintAssetActionJSON).approvals;
        case "transferAsset":
            return (action as TransferAssetActionJSON).approvals;
        case "increaseAssetSupply":
            return (action as IncreaseAssetSupplyActionJSON).approvals;
        case "changeAssetScheme":
            return (action as ChangeAssetSchemeActionJSON).approvals;
        default:
            return null;
    }
}
