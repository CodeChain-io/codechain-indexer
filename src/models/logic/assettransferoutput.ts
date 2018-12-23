import {
    AssetTransferAddress,
    AssetTransferOutput,
    H160,
    H256
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferOutputInstance } from "../assettransferoutput";
import models from "../index";

const P2PKH = "5f5960a7bca6ceeeb0c97bc717562914e7a1de04";
const P2PKHBURN = "37572bdcc22d39a59c0d12d301f6271ba3fdd451";

export async function createAssetTransferOutput(
    transactionHash: H256,
    output: AssetTransferOutput,
    params: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetTransferOutputInstance> {
    let assetTransferOuputInstance: AssetTransferOutputInstance;
    try {
        assetTransferOuputInstance = await models.AssetTransferOutput.create({
            transactionHash: transactionHash.value,
            lockScriptHash: output.lockScriptHash.value,
            parameters: output.parameters,
            assetType: output.assetType.value,
            amount: output.amount.value.toString(10),
            assetScheme: params.assetScheme,
            owner: getOwner(
                output.lockScriptHash,
                output.parameters,
                params.networkId
            )
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return assetTransferOuputInstance;
}

// This is for the cascade test
export async function getByHash(
    hash: H256
): Promise<AssetTransferOutputInstance[]> {
    try {
        return await models.AssetTransferOutput.findAll({
            where: {
                transactionHash: hash.value
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
