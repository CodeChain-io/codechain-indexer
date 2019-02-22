import { Asset, AssetTransferOutput } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferOutputInstance } from "../assettransferoutput";
import models from "../index";
import * as AddressUtil from "./utils/address";
import { strip0xPrefix } from "./utils/format";

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
            transactionHash: strip0xPrefix(transactionHash),
            lockScriptHash: strip0xPrefix(output.lockScriptHash.value),
            parameters: parameters.map(p => strip0xPrefix(p)),
            assetType: strip0xPrefix(output.assetType.value),
            shardId: output.shardId,
            quantity: output.quantity.value.toString(10),
            owner
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
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
                transactionHash: strip0xPrefix(transactionHash)
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
