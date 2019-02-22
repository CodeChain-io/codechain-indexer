import { ChangeAssetScheme } from "codechain-sdk/lib/core/classes";
import { ChangeAssetSchemeActionJSON } from "codechain-sdk/lib/core/transaction/ChangeAssetScheme";
import models from "..";
import { ChangeAssetSchemeInstance } from "../changeAssetScheme";
import * as AssetImageModel from "./assetimage";
import { strip0xPrefix } from "./utils/format";

export async function createChangeAssetScheme(
    transactionHash: string,
    changeAssetScheme: ChangeAssetScheme
): Promise<ChangeAssetSchemeInstance> {
    const {
        assetType,
        networkId,
        shardId,
        metadata,
        approver,
        administrator,
        allowedScriptHashes,
        approvals
    } = changeAssetScheme.toJSON().action as ChangeAssetSchemeActionJSON;
    const inst = await models.ChangeAssetScheme.create({
        transactionHash: strip0xPrefix(transactionHash),
        assetType: strip0xPrefix(assetType),
        networkId,
        shardId,
        metadata,
        approver,
        administrator,
        allowedScriptHashes: allowedScriptHashes.map(hash =>
            strip0xPrefix(hash)
        ),
        approvals
    });
    let metadataObj;
    try {
        metadataObj = JSON.parse(metadata);
    } catch (e) {
        // The metadata can be non-JSON.
    }
    if (metadataObj && metadataObj.icon_url) {
        await AssetImageModel.createAssetImage(
            transactionHash,
            strip0xPrefix(assetType),
            metadataObj.icon_url
        );
    }
    return inst;
}
