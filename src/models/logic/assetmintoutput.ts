import { H256 } from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetMintOutputInstance } from "../assetmintoutput";
import models from "../index";

export async function createAssetMintOutput(
    transactionHash: H256,
    output: AssetMintOutput,
    params: {
        assetType: H256;
        approver: string | null;
        administrator: string | null;
    }
): Promise<AssetMintOutputInstance> {
    let assetMintOutputInstance: AssetMintOutputInstance;
    try {
        assetMintOutputInstance = await models.AssetMintOutput.create({
            transactionHash: transactionHash.value,
            lockScriptHash: output.lockScriptHash.value,
            parameters: output.parameters,
            amount: output.amount!.value.toString(10),
            assetType: params.assetType.value,
            approver: params.approver,
            administrator: params.administrator
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return assetMintOutputInstance;
}

// This is for the cascade test
export async function getByHash(
    transactionHash: H256
): Promise<AssetMintOutputInstance | null> {
    try {
        return await models.AssetMintOutput.findOne({
            where: {
                transactionHash: transactionHash.value
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
