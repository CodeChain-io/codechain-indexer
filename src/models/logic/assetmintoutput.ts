import { Asset } from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import * as Exception from "../../exception";
import { AssetMintOutputInstance } from "../assetmintoutput";
import models from "../index";
import * as AddressUtil from "./utils/address";

export async function createAssetMintOutput(
    transactionHash: string,
    output: AssetMintOutput,
    params: {
        assetType: string;
        approver: string | null;
        administrator: string | null;
        allowedScriptHashes: string[];
        networkId: string;
        asset: Asset;
    }
): Promise<AssetMintOutputInstance> {
    try {
        const parameters = output.parameters.map(p => p.toString("hex"));
        const recipient = AddressUtil.getOwner(
            output.lockScriptHash,
            parameters,
            params.networkId
        );
        return await models.AssetMintOutput.create({
            transactionHash,
            lockScriptHash: output.lockScriptHash.value,
            parameters,
            supply: output.supply!.value.toString(10),
            assetType: params.assetType,
            approver: params.approver,
            administrator: params.administrator,
            allowedScriptHashes: params.allowedScriptHashes,
            recipient
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getByTransactionHash(
    transactionHash: string
): Promise<AssetMintOutputInstance | null> {
    return await models.AssetMintOutput.findOne({
        where: {
            transactionHash
        }
    });
}
