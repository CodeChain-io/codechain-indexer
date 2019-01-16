import { AssetTransferInput } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferInputInstance } from "../assettransferinput";
import models from "../index";
import * as AddressUtil from "./utils/address";

// FIXME: This is duplicated with asset transfer-burn, decompose input
export async function createAssetTransferInput(
    transactionHash: string,
    input: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetTransferInputInstance> {
    let assetTransferInputInstance: AssetTransferInputInstance;
    try {
        const owner =
            input.prevOut.lockScriptHash &&
            input.prevOut.parameters &&
            AddressUtil.getOwner(
                input.prevOut.lockScriptHash,
                input.prevOut.parameters,
                options.networkId
            );
        assetTransferInputInstance = await models.AssetTransferInput.create({
            transactionHash,
            timelock: input.timelock,
            lockScript: input.lockScript,
            unlockScript: input.unlockScript,
            owner,
            assetType: input.prevOut.assetType.value,
            prevOut: {
                transactionId: input.prevOut.transactionId.value,
                index: input.prevOut.index,
                assetType: input.prevOut.assetType.value,
                assetScheme: options.assetScheme,
                amount: input.prevOut.amount.value.toString(10),
                owner,
                lockScriptHash:
                    input.prevOut.lockScriptHash &&
                    input.prevOut.lockScriptHash.value,
                parameters: input.prevOut.parameters
            }
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError;
    }
    return assetTransferInputInstance;
}

// This is for the cascade test
export async function getByTransactionHash(
    transactionHash: string
): Promise<AssetTransferInputInstance[]> {
    try {
        return await models.AssetTransferInput.findAll({
            where: {
                transactionHash
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
