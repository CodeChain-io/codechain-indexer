import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { AssetTransaction } from "codechain-sdk/lib/core/Transaction";

export function isAssetTransactionType(type: string) {
    return (
        type === "mintAsset" ||
        type === "transferAsset" ||
        type === "composeAsset" ||
        type === "decomposeAsset" ||
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
