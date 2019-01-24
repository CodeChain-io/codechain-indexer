import { Asset, AssetTransferOutput } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferOutputInstance } from "../assettransferoutput";
import models from "../index";
import * as AddressUtil from "./utils/address";

export async function createAssetTransferOutput(
    transactionHash: string,
    output: AssetTransferOutput,
    params: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
        asset: Asset;
    }
): Promise<AssetTransferOutputInstance> {
    let assetTransferOuputInstance: AssetTransferOutputInstance;
    try {
        const parameters = output.parameters.map(p => p.toString("hex"));
        const owner = AddressUtil.getOwner(
            output.lockScriptHash,
            parameters,
            params.networkId
        );
        assetTransferOuputInstance = await models.AssetTransferOutput.create({
            transactionHash,
            lockScriptHash: output.lockScriptHash.value,
            parameters,
            assetType: output.assetType.value,
            shardId: output.shardId,
            quantity: output.quantity.value.toString(10),
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
export async function getByTransactionHash(
    transactionHash: string
): Promise<AssetTransferOutputInstance[]> {
    try {
        return await models.AssetTransferOutput.findAll({
            where: {
                transactionHash
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
