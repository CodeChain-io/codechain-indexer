import { ChangeAssetScheme, H160 } from "codechain-sdk/lib/core/classes";
import { ChangeAssetSchemeActionJSON } from "codechain-sdk/lib/core/transaction/ChangeAssetScheme";
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
    return inst;
}
