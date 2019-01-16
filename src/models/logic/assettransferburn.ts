import { AssetTransferInput } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferBurnInstance } from "../assettransferburn";
import models from "../index";
import * as AddressUtil from "./utils/address";

// FIXME: This is duplicated with asset transfer-input
export async function createAssetTransferBurn(
    transactionHash: string,
    burn: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetTransferBurnInstance> {
    let assetTransferBurnInstance: AssetTransferBurnInstance;
    try {
        const owner =
            burn.prevOut.lockScriptHash &&
            burn.prevOut.parameters &&
            AddressUtil.getOwner(
                burn.prevOut.lockScriptHash,
                burn.prevOut.parameters,
                options.networkId
            );
        assetTransferBurnInstance = await models.AssetTransferBurn.create({
            transactionHash,
            timelock: burn.timelock,
            lockScript: burn.lockScript,
            unlockScript: burn.unlockScript,
            owner,
            assetType: burn.prevOut.assetType.value,
            prevOut: {
                transactionId: burn.prevOut.transactionId.value,
                index: burn.prevOut.index,
                assetType: burn.prevOut.assetType.value,
                assetScheme: options.assetScheme,
                amount: burn.prevOut.amount.value.toString(10),
                owner,
                lockScriptHash:
                    burn.prevOut.lockScriptHash &&
                    burn.prevOut.lockScriptHash.value,
                parameters: burn.prevOut.parameters
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return assetTransferBurnInstance;
}

// This is for the cascade test
export async function getByTransactionHash(
    transactionHash: string
): Promise<AssetTransferBurnInstance[]> {
    try {
        return await models.AssetTransferBurn.findAll({
            where: {
                transactionHash
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
