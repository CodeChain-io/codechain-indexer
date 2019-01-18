import { Asset } from "codechain-sdk/lib/core/Asset";
import { AssetScheme } from "codechain-sdk/lib/core/AssetScheme";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import models from "../index";
import { MintAssetInstance } from "../mintAsset";
import { createAssetMintOutput } from "./assetmintoutput";
import { createAssetScheme } from "./assetscheme";
import { getAssetName } from "./utils/asset";

export async function createMintAsset(
    transactionHash: string,
    asset: Asset,
    assetScheme: AssetScheme,
    params: {
        networkId: string;
        shardId: number;
        metadata: string;
        approver?: string | null;
        administrator?: string | null;
        allowedScriptHashes: string[];
        approvals: string[];
        output: any;
    }
): Promise<MintAssetInstance> {
    const {
        networkId,
        shardId,
        metadata,
        approver = null,
        administrator = null,
        approvals,
        allowedScriptHashes,
        output
    } = params;
    const assetName = getAssetName(metadata);
    const inst = await models.MintAsset.create({
        transactionHash,
        networkId,
        shardId,
        metadata,
        approver,
        administrator,
        allowedScriptHashes,
        approvals,
        assetName
    });
    const mintOutput = AssetMintOutput.fromJSON(output);
    const assetType = asset.assetType.value;
    await createAssetMintOutput(transactionHash, mintOutput, {
        assetType,
        approver,
        administrator,
        allowedScriptHashes,
        networkId,
        asset
    });
    await createAssetScheme(assetType, transactionHash, assetScheme);
    return inst;
}
