import {
    AssetTransferOutput,
    MintAsset,
    SignedTransaction
} from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import { MintAssetActionJSON } from "codechain-sdk/lib/core/transaction/MintAsset";
import { Transaction } from "sequelize";
import models from "../index";
import { MintAssetInstance } from "../mintAsset";
import { createAddressLog } from "./addressLog";
import { createAssetScheme } from "./assetscheme";
import { createAssetTransferOutput } from "./assettransferoutput";
import { createAssetTypeLog } from "./assetTypeLog";
import { getOwner } from "./utils/address";
import { getAssetName } from "./utils/asset";
import { strip0xPrefix } from "./utils/format";

export async function createMintAsset(
    transaction: SignedTransaction,
    options: { transaction?: Transaction } = {}
): Promise<MintAssetInstance> {
    const mintAsset = transaction.unsigned as MintAsset;
    const transactionHash = transaction.hash().value;
    const asset = mintAsset.getMintedAsset();
    const {
        networkId,
        shardId,
        metadata,
        approver = null,
        registrar = null,
        approvals,
        allowedScriptHashes,
        output
    } = transaction.toJSON().action as MintAssetActionJSON;
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
    const inst = await models.MintAsset.create(
        {
            transactionHash: strip0xPrefix(transactionHash),
            networkId,
            shardId,
            metadata,
            approver,
            registrar,
            allowedScriptHashes: allowedScriptHashes.map(scripthash =>
                strip0xPrefix(scripthash)
            ),
            approvals,
            lockScriptHash: strip0xPrefix(lockScriptHash),
            parameters,
            supply,
            assetName,
            assetType: strip0xPrefix(assetType),
            recipient
        },
        { transaction: options.transaction }
    );
    // FIXME: if clause is for avoiding primary key conflict. We need to address
    // it properly.
    const existing = await models.AssetScheme.findByPk(assetType, {
        transaction: options.transaction
    });
    if (existing == null) {
        const assetScheme = mintAsset.getAssetScheme();
        await createAssetScheme(
            assetType,
            transactionHash,
            {
                ...assetScheme,
                networkId,
                shardId
            },
            options
        );
    }
    await createAssetTransferOutput(
        transactionHash,
        mintAsset.tracker().toString(),
        new AssetTransferOutput({
            lockScriptHash: mintOutput.lockScriptHash,
            parameters: mintOutput.parameters,
            quantity: mintOutput.supply,
            shardId,
            assetType: mintAsset.getAssetType()
        }),
        0,
        { networkId },
        options
    );
    await Promise.all([
        approver != null
            ? createAddressLog(transaction, approver, "Approver", options)
            : Promise.resolve(null),
        registrar != null
            ? createAddressLog(transaction, registrar, "Registrar", options)
            : Promise.resolve(null),
        recipient != null
            ? createAddressLog(transaction, recipient, "AssetOwner", options)
            : Promise.resolve(null),
        createAssetTypeLog(transaction, assetType, options)
    ]);
    return inst;
}

export async function getByTransactionHash(
    transactionHash: string
): Promise<MintAssetInstance | null> {
    return await models.MintAsset.findOne({
        where: {
            transactionHash: strip0xPrefix(transactionHash)
        }
    });
}
