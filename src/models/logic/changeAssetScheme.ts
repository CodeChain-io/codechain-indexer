import {
    ChangeAssetScheme,
    SignedTransaction
} from "codechain-sdk/lib/core/classes";
import { ChangeAssetSchemeActionJSON } from "codechain-sdk/lib/core/transaction/ChangeAssetScheme";
import { Transaction } from "sequelize";
import models from "..";
import { ChangeAssetSchemeInstance } from "../changeAssetScheme";
import { createAssetTypeLog } from "./assetTypeLog";
import { strip0xPrefix } from "./utils/format";

export async function createChangeAssetScheme(
    transaction: SignedTransaction,
    options: { transaction?: Transaction } = {}
): Promise<ChangeAssetSchemeInstance> {
    const transactionHash = transaction.hash().value;
    const changeAssetScheme = transaction.unsigned as ChangeAssetScheme;
    const {
        assetType,
        networkId,
        shardId,
        metadata,
        approver,
        registrar,
        allowedScriptHashes,
        approvals,
        seq
    } = changeAssetScheme.toJSON().action as ChangeAssetSchemeActionJSON;
    const inst = await models.ChangeAssetScheme.create(
        {
            transactionHash: strip0xPrefix(transactionHash),
            assetType: strip0xPrefix(assetType),
            networkId,
            shardId,
            metadata,
            approver,
            registrar,
            allowedScriptHashes: allowedScriptHashes.map(hash =>
                strip0xPrefix(hash)
            ),
            approvals,
            seq
        },
        { transaction: options.transaction }
    );
    await createAssetTypeLog(transaction, assetType, options);
    return inst;
}
