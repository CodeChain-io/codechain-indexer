import {
    AssetTransferAddress,
    AssetTransferInput,
    H160,
    H256
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferBurnInstance } from "../assettransferburn";
import models from "../index";

const P2PKH = "5f5960a7bca6ceeeb0c97bc717562914e7a1de04";
const P2PKHBURN = "37572bdcc22d39a59c0d12d301f6271ba3fdd451";

// FIXME: This is duplicated with asset transfer-input
export async function createAssetTransferBurn(
    transactionHash: H256,
    burn: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetTransferBurnInstance> {
    let assetTransferBurnInstance: AssetTransferBurnInstance;
    try {
        assetTransferBurnInstance = await models.AssetTransferBurn.create({
            transactionHash: transactionHash.value,
            timelock: burn.timelock,
            lockScript: burn.lockScript,
            unlockScript: burn.unlockScript,
            prevOut: {
                transactionHash: burn.prevOut.transactionHash.value,
                index: burn.prevOut.index,
                assetType: burn.prevOut.assetType.value,
                assetScheme: options.assetScheme,
                amount: burn.prevOut.amount.value.toString(10),
                owner:
                    burn.prevOut.lockScriptHash &&
                    burn.prevOut.parameters &&
                    getOwner(
                        burn.prevOut.lockScriptHash,
                        burn.prevOut.parameters,
                        options.networkId
                    ),
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
export async function getByHash(
    transactionHash: H256
): Promise<AssetTransferBurnInstance[]> {
    try {
        return await models.AssetTransferBurn.findAll({
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
