import { AssetAddress, H160 } from "codechain-sdk/lib/core/classes";
import { TransactionAttribute } from "../../transaction";

const P2PKH = "5f5960a7bca6ceeeb0c97bc717562914e7a1de04";
const P2PKHBURN = "37572bdcc22d39a59c0d12d301f6271ba3fdd451";

export function getOwner(
    lockScriptHash: H160,
    parameters: string[],
    networkId: string
) {
    let owner = "";
    if (lockScriptHash.value === P2PKH) {
        owner = AssetAddress.fromTypeAndPayload(1, new H160(parameters[0]), {
            networkId
        }).value;
    } else if (lockScriptHash.value === P2PKHBURN) {
        owner = AssetAddress.fromTypeAndPayload(2, new H160(parameters[0]), {
            networkId
        }).value;
    } else if (parameters.length === 0) {
        owner = AssetAddress.fromTypeAndPayload(0, lockScriptHash, {
            networkId
        }).value;
    }
    return owner;
}

export function getOwnerFromTransaction(
    tx: TransactionAttribute,
    outputIndex: number
) {
    if (tx.mintAsset && outputIndex === 0) {
        const { lockScriptHash, parameters, recipient } = tx.mintAsset;
        return {
            lockScriptHash,
            parameters,
            owner: recipient
        };
    } else if (
        tx.transferAsset &&
        outputIndex < tx.transferAsset.outputs!.length
    ) {
        const { lockScriptHash, parameters, owner } = tx.transferAsset.outputs![
            outputIndex
        ];
        return { lockScriptHash, parameters, owner };
    } else if (tx.composeAsset && outputIndex === 0) {
        const { lockScriptHash, parameters, recipient } = tx.composeAsset;
        return {
            lockScriptHash,
            parameters,
            owner: recipient
        };
    } else if (
        tx.decomposeAsset &&
        outputIndex < tx.decomposeAsset.outputs!.length
    ) {
        const {
            lockScriptHash,
            parameters,
            owner
        } = tx.decomposeAsset.outputs![outputIndex];
        return { lockScriptHash, parameters, owner };
    } else if (tx.increaseAssetSupply) {
        const {
            lockScriptHash,
            parameters,
            recipient
        } = tx.increaseAssetSupply;
        return {
            lockScriptHash,
            parameters,
            owner: recipient
        };
    } else if (tx.wrapCCC) {
        const { lockScriptHash, parameters, recipient } = tx.wrapCCC;
        return {
            lockScriptHash,
            parameters,
            owner: recipient
        };
    }
    return {
        lockScriptHash: null,
        parameters: null,
        owner: null
    };
}
