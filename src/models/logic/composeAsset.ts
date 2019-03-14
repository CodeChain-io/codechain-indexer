import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import {
    ComposeAsset,
    ComposeAssetActionJSON
} from "codechain-sdk/lib/core/transaction/ComposeAsset";
import { ComposeAssetInstance } from "../composeAsset";
import models from "../index";
import { createAssetScheme } from "./assetscheme";
import { createAssetTransferInput } from "./assettransferinput";
import { getOwner } from "./utils/address";
import { getAssetName } from "./utils/asset";
import { strip0xPrefix } from "./utils/format";

export async function createComposeAsset(
    transaction: SignedTransaction
): Promise<ComposeAssetInstance> {
    const transactionHash = transaction.hash().value;
    const compose = transaction.unsigned as ComposeAsset;
    const {
        networkId,
        shardId,
        metadata,
        approver = null,
        registrar = null,
        approvals,
        allowedScriptHashes,
        output,
        inputs
    } = transaction.toJSON().action as ComposeAssetActionJSON;
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
        transactionHash: strip0xPrefix(transactionHash),
        networkId,
        shardId,
        metadata,
        approver,
        registrar,
        allowedScriptHashes: allowedScriptHashes.map(hash =>
            strip0xPrefix(hash)
        ),
        approvals,
        lockScriptHash: strip0xPrefix(lockScriptHash),
        parameters: parameters.map((p: string) => strip0xPrefix(p)),
        supply,
        assetName,
        assetType: strip0xPrefix(assetType),
        recipient
    });

    await Promise.all(
        inputs.map(async (_: any, index: number) => {
            const input = compose.input(index)!;
            await createAssetTransferInput(transactionHash, input, index, {
                networkId
            });
        })
    );

    const assetScheme: any = compose.getAssetScheme();
    assetScheme.networkId = assetScheme.networkId!;
    await createAssetScheme(assetType, transactionHash, assetScheme);
    return result;
}
