import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import { ComposeAsset } from "codechain-sdk/lib/core/transaction/ComposeAsset";
import { ComposeAssetInstance } from "../composeAsset";
import models from "../index";
import { createAssetMintOutput } from "./assetmintoutput";
import { createAssetScheme } from "./assetscheme";
import { createAssetTransferInput } from "./assettransferinput";
import { getAssetName, getAssetScheme } from "./utils/asset";

export async function createComposeAsset(
    transactionHash: string,
    compose: ComposeAsset,
    params: {
        networkId: string;
        shardId: number;
        metadata: string;
        approver?: string | null;
        administrator?: string | null;
        approvals: string[];
        inputs: any[];
        output: any;
    }
): Promise<ComposeAssetInstance> {
    const {
        networkId,
        shardId,
        metadata,
        approver = null,
        administrator = null,
        approvals,
        output,
        inputs
    } = params;
    const assetName = getAssetName(metadata);

    const asset = compose.getComposedAsset();
    const assetType = asset.assetType.value;
    const result = await models.ComposeAsset.create({
        transactionHash,
        networkId,
        shardId,
        metadata,
        approver,
        administrator,
        approvals,
        assetName
    });

    const composedOutput = AssetMintOutput.fromJSON(output);
    await Promise.all(
        inputs.map(async (_: any, index: number) => {
            const input = compose.input(index)!;
            const assetScheme = await getAssetScheme(input.prevOut.assetType);
            await createAssetTransferInput(transactionHash, input, {
                networkId,
                assetScheme
            });
        })
    );
    await createAssetMintOutput(transactionHash, composedOutput, {
        assetType,
        approver,
        administrator,
        networkId,
        asset
    });
    await createAssetScheme(
        assetType,
        transactionHash,
        compose.getAssetScheme()
    );
    return result;
}
