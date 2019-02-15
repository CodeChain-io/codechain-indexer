import { Asset } from "codechain-sdk/lib/core/Asset";
import { AssetScheme } from "codechain-sdk/lib/core/AssetScheme";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import models from "../index";
import { MintAssetInstance } from "../mintAsset";
import { createAssetScheme } from "./assetscheme";
import { getOwner } from "./utils/address";
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
    const mintOutput = AssetMintOutput.fromJSON(output);
    const assetType = asset.assetType.value;
    const { lockScriptHash, parameters } = output;
    const supply = mintOutput.supply!.toString(10);

    const recipient = getOwner(
        mintOutput.lockScriptHash,
        parameters,
        networkId
    );
    const inst = await models.MintAsset.create({
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
    const assetSchemeWithNetworkId: any = assetScheme;
    assetSchemeWithNetworkId.networkId = networkId;
    // FIXME: if clause is for avoiding primary key conflict. We need to address
    // it properly.
    const existing = await models.AssetScheme.findByPk(assetType);
    if (existing == null) {
        await createAssetScheme(
            assetType,
            transactionHash,
            assetSchemeWithNetworkId
        );
    }
    return inst;
}

export async function getByTransactionHash(
    transactionHash: string
): Promise<MintAssetInstance | null> {
    return await models.MintAsset.findOne({
        where: {
            transactionHash
        }
    });
}
