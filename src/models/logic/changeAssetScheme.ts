import { ChangeAssetScheme, H160 } from "codechain-sdk/lib/core/classes";
import { ChangeAssetSchemeActionJSON } from "codechain-sdk/lib/core/transaction/ChangeAssetScheme";
import models from "..";
import { ChangeAssetSchemeInstance } from "../changeAssetScheme";
import * as AssetImageModel from "./assetimage";

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
        transactionHash,
        assetType: H160.ensure(assetType).value,
        networkId,
        shardId,
        metadata,
        approver,
        administrator,
        allowedScriptHashes,
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
            H160.ensure(assetType).value,
            metadataObj.icon_url
        );
    }
    return inst;
}
