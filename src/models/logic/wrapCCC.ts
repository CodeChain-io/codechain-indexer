import {
    AssetTransferOutput,
    H160,
    SignedTransaction,
    U64
} from "codechain-sdk/lib/core/classes";
import {
    WrapCCC,
    WrapCCCActionJSON
} from "codechain-sdk/lib/core/transaction/WrapCCC";
import { Transaction } from "sequelize";
import models from "../index";
import { WrapCCCInstance } from "../wrapCCC";
import { createAddressLog } from "./addressLog";
import { createAssetAddressLog } from "./assetAddressLog";
import { createAssetSchemeOfWCCC } from "./assetscheme";
import { createAssetTransferOutput } from "./assettransferoutput";
import { createAssetTypeLog } from "./assetTypeLog";
import { getOwner } from "./utils/address";
import { strip0xPrefix } from "./utils/format";

export async function createWrapCCC(
    transaction: SignedTransaction,
    options: { transaction?: Transaction } = {}
): Promise<WrapCCCInstance> {
    const transactionHash = transaction.hash().value;
    const wrapCCC = transaction.unsigned as WrapCCC;
    const {
        shardId,
        lockScriptHash,
        parameters,
        quantity,
        payer
    } = transaction.toJSON().action as WrapCCCActionJSON;
    const networkId = transaction.unsigned.networkId();

    const recipient = getOwner(new H160(lockScriptHash), parameters, networkId);

    const result = await models.WrapCCC.create(
        {
            transactionHash: strip0xPrefix(transactionHash),
            shardId,
            lockScriptHash: strip0xPrefix(lockScriptHash),
            parameters: parameters.map(p => strip0xPrefix(p)),
            quantity: new U64(quantity).toString(),
            recipient
        },
        { transaction: options.transaction }
    );
    const existing = await models.AssetScheme.findByPk(H160.zero().toString(), {
        transaction: options.transaction
    });
    if (existing == null) {
        await createAssetSchemeOfWCCC(
            transactionHash,
            {
                networkId,
                shardId
            },
            options
        );
    }
    await createAssetTransferOutput(
        transactionHash,
        wrapCCC.tracker().toString(),
        AssetTransferOutput.fromJSON({
            lockScriptHash,
            parameters,
            quantity,
            shardId,
            assetType: H160.zero().toString()
        }),
        0,
        { networkId },
        options
    );
    await createAddressLog(transaction, payer, "AssetOwner", options);
    const assetType = "0000000000000000000000000000000000000000";
    if (recipient) {
        await createAssetAddressLog(transaction, recipient, assetType, options);
    }
    await createAssetTypeLog(transaction, assetType, options);
    return result;
}
