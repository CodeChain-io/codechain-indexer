import {
    AssetTransferOutput,
    SignedTransaction
} from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import {
    ComposeAsset,
    ComposeAssetActionJSON
} from "codechain-sdk/lib/core/transaction/ComposeAsset";
import * as _ from "lodash";
import { ComposeAssetInstance } from "../composeAsset";
import models from "../index";
import { createAddressLog } from "./addressLog";
import { createAssetScheme } from "./assetscheme";
import {
    createAssetTransferOutput,
    getOutputOwner
} from "./assettransferoutput";
import { createAssetTypeLog } from "./assetTypeLog";
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
        recipient,
        inputs: await Promise.all(
            inputs.map(async (i, index) => {
                const {
                    owner,
                    lockScriptHash: prevOutLockScriptHash,
                    parameters: prevOutParameters
                } = await getOutputOwner(i.prevOut.tracker, i.prevOut.index);
                return {
                    index,
                    prevOut: {
                        tracker: strip0xPrefix(i.prevOut.tracker),
                        index: i.prevOut.index,
                        assetType: strip0xPrefix(i.prevOut.assetType),
                        shardId: i.prevOut.shardId,
                        quantity: i.prevOut.quantity,
                        owner,
                        lockScriptHash: prevOutLockScriptHash,
                        parameters: prevOutParameters
                    },
                    timelock: i.timelock,
                    assetType: strip0xPrefix(i.prevOut.assetType),
                    shardId: i.prevOut.shardId,
                    lockScript: Buffer.from(i.lockScript),
                    unlockScript: Buffer.from(i.unlockScript),
                    owner
                };
            })
        )
    });

    const assetScheme: any = compose.getAssetScheme();
    assetScheme.networkId = assetScheme.networkId!;
    await createAssetScheme(assetType, transactionHash, assetScheme);

    await createAssetTransferOutput(
        transactionHash,
        compose.tracker().toString(),
        new AssetTransferOutput({
            lockScriptHash: asset.lockScriptHash,
            parameters: asset.parameters,
            quantity: asset.quantity,
            shardId,
            assetType: compose.getAssetType()
        }),
        0,
        { networkId }
    );

    const { inputs: resultInputs } = result.get({ plain: true });
    await Promise.all([
        approver != null
            ? createAddressLog(transaction, approver, "Approver")
            : Promise.resolve(null),
        registrar != null
            ? createAddressLog(transaction, registrar, "Registrar")
            : Promise.resolve(null),
        ..._.uniq(
            [
                recipient,
                ...resultInputs.map(input => input.prevOut.owner)
            ].filter(address => address != null)
        ).map(address => createAddressLog(transaction, address!, "AssetOwner"))
    ]);
    await Promise.all(
        [
            compose.getAssetType().toString(),
            ..._.uniq(resultInputs.map(input => input.assetType))
        ].map(type => createAssetTypeLog(transaction, type))
    );

    return result;
}
