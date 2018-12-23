import {
    AssetTransferAddress,
    AssetTransferInput,
    H160,
    H256
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetDecomposeInputInstance } from "../assetdecomposeinput";
import { AssetSchemeAttribute } from "../assetscheme";
import models from "../index";

const P2PKH = "5f5960a7bca6ceeeb0c97bc717562914e7a1de04";
const P2PKHBURN = "37572bdcc22d39a59c0d12d301f6271ba3fdd451";

// FIXME: This is duplicated with asset transfer-input
export async function createDecomposeInput(
    transactionHash: H256,
    input: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetDecomposeInputInstance> {
    let assetDecomposeInputInstance: AssetDecomposeInputInstance;
    try {
        assetDecomposeInputInstance = await models.AssetDecomposeInput.create({
            transactionHash: transactionHash.value,
            timelock: input.timelock,
            lockScript: input.lockScript,
            unlockScript: input.unlockScript,
            prevOut: {
                transactionHash: input.prevOut.transactionHash.value,
                index: input.prevOut.index,
                assetType: input.prevOut.assetType.value,
                assetScheme: options.assetScheme,
                amount: input.prevOut.amount.value.toString(10),
                owner:
                    input.prevOut.lockScriptHash &&
                    input.prevOut.parameters &&
                    getOwner(
                        input.prevOut.lockScriptHash,
                        input.prevOut.parameters,
                        options.networkId
                    ),
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
export async function getByHash(
    transactionHash: H256
): Promise<AssetDecomposeInputInstance | null> {
    try {
        return await models.AssetDecomposeInput.findOne({
            where: {
                transactionHash: transactionHash.value
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

function getOwner(
    lockScriptHash: H160,
    parameters: Buffer[],
    networkId: string
) {
    let owner = "";
    if (lockScriptHash.value === P2PKH) {
        owner = AssetTransferAddress.fromTypeAndPayload(
            1,
            new H160(Buffer.from(parameters[0]).toString("hex")),
            {
                networkId
            }
        ).value;
    } else if (lockScriptHash.value === P2PKHBURN) {
        owner = AssetTransferAddress.fromTypeAndPayload(
            2,
            new H160(Buffer.from(parameters[0]).toString("hex")),
            {
                networkId
            }
        ).value;
    } else if (parameters.length === 0) {
        owner = AssetTransferAddress.fromTypeAndPayload(0, lockScriptHash, {
            networkId
        }).value;
    }
    return owner;
}
