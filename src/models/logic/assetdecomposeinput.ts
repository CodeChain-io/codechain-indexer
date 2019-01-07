import { AssetTransferInput } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetDecomposeInputInstance } from "../assetdecomposeinput";
import { AssetSchemeAttribute } from "../assetscheme";
import models from "../index";
import * as AddressUtil from "./utils/address";

// FIXME: This is duplicated with asset transfer-input
export async function createDecomposeInput(
    actionId: number,
    input: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetDecomposeInputInstance> {
    let assetDecomposeInputInstance: AssetDecomposeInputInstance;
    try {
        const owner =
            input.prevOut.lockScriptHash &&
            input.prevOut.parameters &&
            AddressUtil.getOwner(
                input.prevOut.lockScriptHash,
                input.prevOut.parameters,
                options.networkId
            );
        assetDecomposeInputInstance = await models.AssetDecomposeInput.create({
            actionId,
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
        console.error(err);
        throw Exception.DBError;
    }
    return assetDecomposeInputInstance;
}

// This is for the cascade test
export async function getByActionId(
    actionId: number
): Promise<AssetDecomposeInputInstance | null> {
    try {
        return await models.AssetDecomposeInput.findOne({
            where: {
                actionId
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
