import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import { ComposeAsset } from "codechain-sdk/lib/core/transaction/ComposeAsset";
import { ComposeAssetInstance } from "../composeAsset";
import models from "../index";
import { createAssetScheme } from "./assetscheme";
import { createAssetTransferInput } from "./assettransferinput";
import { getOwner } from "./utils/address";
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
        allowedScriptHashes: string[];
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
        allowedScriptHashes,
        output,
        inputs
    } = params;
    const assetName = getAssetName(metadata);

    const asset = compose.getComposedAsset();
    const assetType = asset.assetType.value;
    const composedOutput = AssetMintOutput.fromJSON(output);
    const { lockScriptHash, parameters } = output;
    const supply = composedOutput.supply!.toString(10);
    const recipient = getOwner(
        composedOutput.lockScriptHash,
        parameters,
        networkId
    );

    const result = await models.ComposeAsset.create({
        transactionHash,
        networkId,
        shardId,
        metadata,
        approver,
        administrator,
        allowedScriptHashes,
        approvals,
        lockScriptHash,
        parameters,
        supply,
        assetName,
        assetType,
        recipient
    });

    await Promise.all(
        inputs.map(async (_: any, index: number) => {
            const input = compose.input(index)!;
            const inputAssetScheme: any = await getAssetScheme(
                input.prevOut.assetType
            );
            inputAssetScheme.networkId = inputAssetScheme.networkId!;
            await createAssetTransferInput(transactionHash, input, {
                networkId,
                assetScheme: inputAssetScheme
            });
        })
    );

    const assetScheme: any = compose.getAssetScheme();
    assetScheme.networkId = assetScheme.networkId!;
    await createAssetScheme(assetType, transactionHash, assetScheme);
    return result;
}
