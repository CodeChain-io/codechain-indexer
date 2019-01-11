import { Asset } from "codechain-sdk/lib/core/Asset";
import {
    AssetTransferOutput,
    ComposeAsset,
    DecomposeAsset,
    H256,
    MintAsset,
    PlatformAddress,
    Transaction,
    TransferAsset
} from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import * as Exception from "../../exception";
import { ActionInstance } from "../action";
import { AssetSchemeAttribute } from "../assetscheme";
import models from "../index";
import { createAssetMintOutput } from "./assetmintoutput";
import { createAssetScheme, getByAssetType } from "./assetscheme";
import { createAssetTransferBurn } from "./assettransferburn";
import { createAssetTransferInput } from "./assettransferinput";
import { createAssetTransferOutput } from "./assettransferoutput";
import * as TxModel from "./transaction";

export async function createAction(tx: Transaction): Promise<ActionInstance> {
    try {
        const type = tx.type();
        const networkId = tx.networkId();
        if (type === "mintAsset") {
            // FIXME: add proper getter to sdk
            const mintAsset = tx as MintAsset;
            const mint = tx.toJSON();

            const action = await models.Action.create({
                type,
                networkId,
                shardId: mint.action.shardId,
                metadata: mint.action.metadata,
                approver: mint.action.approver,
                administrator: mint.action.administrator,
                approvals: mint.action.approvals,
                assetName: getAssetName(mint.action.metadata)
            });
            const actionId = action.getDataValue("id");

            const output = AssetMintOutput.fromJSON(mint.action.output);
            const assetType = mintAsset.getAssetSchemeAddress();
            await createAssetMintOutput(actionId, output, {
                assetType,
                approver: mint.action.approver && mint.action.approver.value,
                administrator:
                    mint.action.administrator &&
                    mint.action.administrator.value,
                networkId,
                asset: mintAsset.getMintedAsset()
            });
            await createAssetScheme(
                assetType,
                actionId,
                mintAsset.getAssetScheme()
            );

            return action;
        }
        if (type === "transferAsset") {
            // FIXME: add proper getter
            const transfer = tx.toJSON();
            const transferAsset = tx as TransferAsset;

            const action = await models.Action.create({
                type,
                networkId,
                approvals: transfer.action.approvals
            });
            const actionId = action.getDataValue("id");

            // FIXME: Extract the below code to function. The only difference between inputs and burns are createAssetTransfer* functions.
            await Promise.all(
                transfer.action.inputs.map(async (_: any, index: number) => {
                    const input = transferAsset.input(index)!;
                    const assetScheme = await getAssetSheme(
                        input.prevOut.assetType
                    );
                    return createAssetTransferInput(actionId, input, {
                        networkId,
                        assetScheme
                    });
                })
            );
            await Promise.all(
                transfer.action.burns.map(async (_: any, index: number) => {
                    const burn = transferAsset.burn(index)!;
                    const assetScheme = await getAssetSheme(
                        burn.prevOut.assetType
                    );
                    return createAssetTransferBurn(actionId, burn, {
                        networkId,
                        assetScheme
                    });
                })
            );
            await Promise.all(
                transfer.action.outputs.map(
                    async (json: any, transactionOutputIndex: number) => {
                        const output = AssetTransferOutput.fromJSON(json);
                        const assetScheme = await getAssetSheme(
                            output.assetType
                        );
                        return createAssetTransferOutput(actionId, output, {
                            networkId,
                            assetScheme,
                            asset: new Asset({
                                assetType: output.assetType,
                                lockScriptHash: output.lockScriptHash,
                                parameters: output.parameters,
                                amount: output.amount,
                                orderHash: null,
                                transactionId: transferAsset.id(),
                                transactionOutputIndex
                            })
                        });
                    }
                )
            );
            return action;
        }
        if (type === "composeAsset") {
            // FIXME: add proper getter
            const compose = tx.toJSON();
            const composeAsset = tx as ComposeAsset;

            const action = await models.Action.create({
                type,
                networkId,
                shardId: compose.action.shardId,
                metadata: compose.action.metadata,
                approver: compose.action.approver,
                administrator: compose.action.administrator,
                approvals: compose.action.approvals,
                assetName: getAssetName(compose.action.metadata)
            });
            const actionId = action.getDataValue("id");

            const output = AssetMintOutput.fromJSON(compose.action.output);
            const assetType = composeAsset.getAssetSchemeAddress();
            await createAssetMintOutput(actionId, output, {
                assetType,
                approver:
                    compose.action.approver && compose.action.approver.value,
                administrator:
                    compose.action.administrator &&
                    compose.action.administrator.value,
                networkId,
                asset: composeAsset.getComposedAsset()
            });
            await createAssetScheme(
                assetType,
                actionId,
                composeAsset.getAssetScheme()
            );
            return action;
        }
        if (type === "decomposeAsset") {
            // FIXME: add proper getter
            const decompose = tx.toJSON();
            const decomposeAsset = tx as DecomposeAsset;

            const action = await models.Action.create({
                type,
                networkId,
                approvals: decompose.action.approvals
            });
            const actionId = action.getDataValue("id");

            const input = decomposeAsset.input(0)!;

            const inputAssetScheme = await getAssetSheme(
                input.prevOut.assetType
            );
            await createAssetTransferInput(actionId, input, {
                networkId,
                assetScheme: inputAssetScheme
            });
            await Promise.all(
                decompose.action.outputs.map(
                    async (json: any, transactionOutputIndex: number) => {
                        const output = AssetTransferOutput.fromJSON(json);
                        const assetScheme = await getAssetSheme(
                            output.assetType
                        );
                        return createAssetTransferOutput(actionId, output, {
                            networkId,
                            assetScheme,
                            asset: new Asset({
                                assetType: output.assetType,
                                lockScriptHash: output.lockScriptHash,
                                parameters: output.parameters,
                                amount: output.amount,
                                orderHash: null,
                                transactionId: decomposeAsset.id(),
                                transactionOutputIndex
                            })
                        });
                    }
                )
            );
            return action;
        }
        if (type === "pay") {
            return await models.Action.create({
                type,
                // FIXME: remove any
                amount: (tx as any).amount.value.toString(10),
                receiver: (tx as any).receiver.value
            });
        }
        if (type === "setRegularKey") {
            return await models.Action.create({
                type,
                // FIXME: remove any
                key: (tx as any).key.value
            });
        }
        if (type === "createShard") {
            return await models.Action.create({
                type
            });
        }
        if (type === "setShardOwners") {
            return await models.Action.create({
                type,
                // FIXME: remove any
                shardId: (tx as any).shardId,
                owners: (tx as any).owners.map(
                    (owner: PlatformAddress) => owner.value
                )
            });
        }
        if (type === "setShardUsers") {
            return await models.Action.create({
                type,
                // FIXME: remove any
                shardId: (tx as any).shardId,
                users: (tx as any).users.map(
                    (user: PlatformAddress) => user.value
                )
            });
        }
        if (type === "store") {
            return models.Action.create({
                type,
                // FIXME: remove any
                content: (tx as any).content,
                certifier: (tx as any).certifier.value,
                signature: (tx as any).signature
            });
        }
        if (type === "remove") {
            return models.Action.create({
                type,
                // FIXME: remove any
                textHash: (tx as any)._hash.value,
                signature: (tx as any).signature
            });
        }
        console.error(`${type} is not an expected action type`);
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    throw Exception.InvalidAction;
}

async function getAssetSheme(assetType: H256): Promise<AssetSchemeAttribute> {
    const assetSchemeInstance = await getByAssetType(assetType);
    if (!assetSchemeInstance) {
        throw Exception.InvalidTransaction;
    }
    return assetSchemeInstance.get({
        plain: true
    });
}

function getAssetName(metadata: string): string | undefined {
    try {
        return JSON.parse(metadata).name;
    } catch (e) {
        return undefined;
    }
}

// @ts-ignore
export async function getByHash(hash: H256): Promise<ActionInstance | null> {
    const tx = await TxModel.getByHash(hash);
    if (tx === null) {
        return null;
    }
    return tx.getAction();
}
