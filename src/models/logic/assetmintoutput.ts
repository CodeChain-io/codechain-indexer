import { Asset, H256 } from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import * as Exception from "../../exception";
import { AssetMintOutputInstance } from "../assetmintoutput";
import models from "../index";
import * as AddressUtil from "./utils/address";

export async function createAssetMintOutput(
    actionId: number,
    output: AssetMintOutput,
    params: {
        assetType: H256;
        approver: string | null;
        administrator: string | null;
        networkId: string;
        asset: Asset;
    }
): Promise<AssetMintOutputInstance> {
    try {
        const recipient = AddressUtil.getOwner(
            output.lockScriptHash,
            output.parameters,
            params.networkId
        );
        return await models.AssetMintOutput.create({
            actionId,
            lockScriptHash: output.lockScriptHash.value,
            parameters: output.parameters,
            amount: output.amount!.value.toString(10),
            assetType: params.assetType.value,
            approver: params.approver,
            administrator: params.administrator,
            recipient
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

// This is for the cascade test
export async function getByActionId(
    actionId: number
): Promise<AssetMintOutputInstance | null> {
    try {
        return await models.AssetMintOutput.findOne({
            where: {
                actionId
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
