import { ChangeAssetScheme } from "codechain-sdk/lib/core/classes";
import models from "..";
import { ChangeAssetSchemeInstance } from "../changeAssetScheme";

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
    } = changeAssetScheme.toJSON().action;
    const inst = await models.ChangeAssetScheme.create({
        transactionHash,
        assetType,
        networkId,
        shardId,
        metadata,
        approver,
        administrator,
        allowedScriptHashes,
        approvals
    });
    return inst;
}
