import {
    ComposeAsset,
    DecomposeAsset,
    MintAsset,
    SignedTransaction,
    TransferAsset,
    WrapCCC
} from "codechain-sdk/lib/core/classes";
import { AssetTransaction } from "codechain-sdk/lib/core/Transaction";
import { IncreaseAssetSupply } from "codechain-sdk/lib/core/transaction/IncreaseAssetSupply";
import { AssetTransferOutputAttribute } from "../../assettransferoutput";
import { getOwner } from "./address";

export function isAssetTransactionType(type: string) {
    return (
        type === "mintAsset" ||
        type === "transferAsset" ||
        type === "composeAsset" ||
        type === "decomposeAsset" ||
        type === "increaseAssetSupply" ||
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

export function getTransactionOutputs(
    transaction: SignedTransaction
): AssetTransferOutputAttribute[] {
    const transactionHash = transaction.hash().toString();
    switch (transaction.unsigned.type()) {
        case "mintAsset":
            const mintAsset = (transaction.unsigned as unknown) as MintAsset;
            return [
                {
                    transactionHash,
                    transactionTracker: mintAsset.tracker().toString(),
                    lockScriptHash: mintAsset
                        .output()
                        .lockScriptHash.toString(),
                    parameters: mintAsset
                        .output()
                        .parameters.map(p => p.toString("hex")),
                    quantity: mintAsset.output().supply.toString(),
                    assetType: mintAsset.getAssetType().toString(),
                    shardId: mintAsset.getMintedAsset().shardId,
                    index: 0,
                    owner: getOwner(
                        mintAsset.output().lockScriptHash,
                        mintAsset
                            .output()
                            .parameters.map(p => p.toString("hex")),
                        mintAsset.networkId()
                    )
                }
            ];
        case "transferAsset":
            const transferAsset = (transaction.unsigned as unknown) as TransferAsset;
            return transferAsset.outputs().map((output, index) => ({
                transactionHash,
                transactionTracker: transferAsset.tracker().toString(),
                lockScriptHash: output.lockScriptHash.toString(),
                parameters: output.parameters.map(p => p.toString("hex")),
                assetType: output.assetType.toString(),
                shardId: output.shardId,
                quantity: output.quantity.toString(),
                index,
                owner: getOwner(
                    output.lockScriptHash,
                    output.parameters.map(p => p.toString("hex")),
                    transferAsset.networkId()
                )
            }));
        case "composeAsset":
            const composeAsset = (transaction.unsigned as unknown) as ComposeAsset;
            return [
                {
                    transactionHash,
                    transactionTracker: composeAsset.tracker().toString(),
                    lockScriptHash: composeAsset
                        .getComposedAsset()
                        .lockScriptHash.toString(),
                    parameters: composeAsset
                        .getComposedAsset()
                        .parameters.map(p => p.toString("hex")),
                    quantity: composeAsset
                        .getComposedAsset()
                        .quantity.toString(),
                    assetType: composeAsset.getAssetType().toString(),
                    shardId: composeAsset.getComposedAsset().shardId,
                    index: 0,
                    owner: getOwner(
                        composeAsset.getComposedAsset().lockScriptHash,
                        composeAsset
                            .getComposedAsset()
                            .parameters.map(p => p.toString("hex")),
                        composeAsset.networkId()
                    )
                }
            ];
        case "decomposeAsset":
            const decomposeAsset = (transaction.unsigned as unknown) as DecomposeAsset;
            return decomposeAsset
                .getTransferredAssets()
                .map((asset, index) => ({
                    transactionHash,
                    transactionTracker: transferAsset.tracker().toString(),
                    lockScriptHash: asset.lockScriptHash.toString(),
                    parameters: asset.parameters.map(p => p.toString("hex")),
                    assetType: asset.assetType.toString(),
                    shardId: asset.shardId,
                    quantity: asset.quantity.toString(),
                    index,
                    owner: getOwner(
                        asset.lockScriptHash,
                        asset.parameters.map(p => p.toString("hex")),
                        transferAsset.networkId()
                    )
                }));
        case "increaseAssetSupply":
            const increaseAssetSupply = (transaction.unsigned as unknown) as IncreaseAssetSupply;
            return [
                {
                    transactionHash,
                    transactionTracker: increaseAssetSupply
                        .tracker()
                        .toString(),
                    lockScriptHash: increaseAssetSupply
                        .output()
                        .lockScriptHash.toString(),
                    parameters: increaseAssetSupply
                        .output()
                        .parameters.map(p => p.toString("hex")),
                    quantity: increaseAssetSupply.output().supply.toString(),
                    assetType: increaseAssetSupply
                        .getMintedAsset()
                        .assetType.toString(),
                    shardId: increaseAssetSupply.getMintedAsset().shardId,
                    index: 0,
                    owner: getOwner(
                        increaseAssetSupply.output().lockScriptHash,
                        increaseAssetSupply
                            .output()
                            .parameters.map(p => p.toString("hex")),
                        increaseAssetSupply.networkId()
                    )
                }
            ];
        case "wrapCCC":
            const wrapCCC = (transaction.unsigned as unknown) as WrapCCC;
            const {
                lockScriptHash,
                parameters,
                quantity,
                assetType,
                shardId
            } = wrapCCC.getAsset();
            return [
                {
                    transactionHash,
                    transactionTracker: wrapCCC.tracker().toString(),
                    lockScriptHash: lockScriptHash.toString(),
                    parameters: parameters.map(p => p.toString("hex")),
                    quantity: quantity.toString(10),
                    assetType: assetType.toString(),
                    shardId,
                    index: 0,
                    owner: getOwner(
                        lockScriptHash,
                        parameters.map(p => p.toString("hex")),
                        wrapCCC.networkId()
                    )
                }
            ];
        default:
            return [];
    }
}
