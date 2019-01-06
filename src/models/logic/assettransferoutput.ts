import {
    Asset,
    AssetTransferOutput,
    H256
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferOutputInstance } from "../assettransferoutput";
import models from "../index";
import * as AddressUtil from "./utils/address";

export async function createAssetTransferOutput(
    transactionHash: H256,
    output: AssetTransferOutput,
    params: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
        asset: Asset;
    }
): Promise<AssetTransferOutputInstance> {
    let assetTransferOuputInstance: AssetTransferOutputInstance;
    try {
        const owner = AddressUtil.getOwner(
            output.lockScriptHash,
            output.parameters,
            params.networkId
        );
        assetTransferOuputInstance = await models.AssetTransferOutput.create({
            transactionHash: transactionHash.value,
            lockScriptHash: output.lockScriptHash.value,
            parameters: output.parameters,
            assetType: output.assetType.value,
            amount: output.amount.value.toString(10),
            assetScheme: params.assetScheme,
            owner
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
