import { H256 } from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetMintOutputInstance } from "../assetmintoutput";
import models from "../index";

export async function createAssetMintOutput(
    transactionHash: H256,
    assetMintOutput: AssetMintOutput,
    options: {
        approver?: string | null;
        administrator?: string | null;
        assetType: H256;
    }
): Promise<AssetMintOutputInstance> {
    let assetMintOutputInstance;
    try {
        assetMintOutputInstance = await models.AssetMintOutput.create({
            transactionHash: transactionHash.value,
            lockScriptHash: assetMintOutput.lockScriptHash.value,
            parameters: assetMintOutput.parameters,
            amount:
                assetMintOutput.amount &&
                assetMintOutput.amount.value.toString(10),
            approver: options.approver,
            administrator: options.administrator,
            assetType: options.assetType.value
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return assetMintOutputInstance;
}

// For testing
export async function getById(
    id: string
): Promise<AssetMintOutputInstance | null> {
    try {
        return await models.AssetMintOutput.findOne({
            where: {
                id
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
