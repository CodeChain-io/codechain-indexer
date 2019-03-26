import {
    AssetTransferOutput,
    H160,
    Order,
    SignedTransaction,
    U64
} from "codechain-sdk/lib/core/classes";
import {
    TransferAsset,
    TransferAssetActionJSON
} from "codechain-sdk/lib/core/transaction/TransferAsset";
import models from "../index";
import { TransferAssetInstance } from "../transferAsset";
import {
    createAssetTransferOutput,
    getOutputOwner
} from "./assettransferoutput";
import { getOwner } from "./utils/address";
import { strip0xPrefix } from "./utils/format";

export async function createTransferAsset(
    transaction: SignedTransaction
): Promise<TransferAssetInstance> {
    const {
        networkId,
        metadata,
        approvals,
        expiration,
        inputs,
        outputs,
        burns,
        orders
    } = transaction.toJSON().action as TransferAssetActionJSON;
    const transfer = transaction.unsigned as TransferAsset;
    const transactionHash = transaction.hash().value;
    const result = await models.TransferAsset.create({
        transactionHash: strip0xPrefix(transactionHash),
        networkId,
        metadata,
        approvals,
        expiration: expiration == null ? null : new U64(expiration).toString(),
        inputs: await Promise.all(
            inputs.map(async (i, index) => {
                const {
                    owner,
                    lockScriptHash,
                    parameters
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
                        lockScriptHash,
                        parameters
                    },
                    timelock: i.timelock,
                    assetType: strip0xPrefix(i.prevOut.assetType),
                    shardId: i.prevOut.shardId,
                    lockScript: Buffer.from(i.lockScript),
                    unlockScript: Buffer.from(i.unlockScript),
                    owner
                };
            })
        ),
        burns: await Promise.all(
            burns.map(async (b, index) => {
                const {
                    owner,
                    lockScriptHash,
                    parameters
                } = await getOutputOwner(b.prevOut.tracker, b.prevOut.index);
                return {
                    index,
                    prevOut: {
                        tracker: strip0xPrefix(b.prevOut.tracker),
                        index: b.prevOut.index,
                        assetType: strip0xPrefix(b.prevOut.assetType),
                        shardId: b.prevOut.shardId,
                        quantity: b.prevOut.quantity,
                        owner,
                        lockScriptHash,
                        parameters
                    },
                    timelock: b.timelock,
                    assetType: strip0xPrefix(b.prevOut.assetType),
                    shardId: b.prevOut.shardId,
                    lockScript: Buffer.from(b.lockScript),
                    unlockScript: Buffer.from(b.unlockScript),
                    owner
                };
            })
        ),
        outputs: outputs.map((o, index) => {
            return {
                index,
                lockScriptHash: strip0xPrefix(o.lockScriptHash),
                parameters: o.parameters.map(p => strip0xPrefix(p)),
                assetType: strip0xPrefix(o.assetType),
                shardId: o.shardId,
                quantity: o.quantity,
                owner: getOwner(
                    new H160(o.lockScriptHash),
                    o.parameters,
                    transfer.networkId()
                )
            };
        }),
        orders: await Promise.all(
            orders.map(async (o, index) => {
                return {
                    index,
                    spentQuantity: o.spentQuantity,
                    order: {
                        orderHash: strip0xPrefix(
                            Order.fromJSON(o.order).hash().value
                        ),
                        assetTypeFrom: strip0xPrefix(o.order.assetTypeFrom),
                        assetTypeTo: strip0xPrefix(o.order.assetTypeTo),
                        assetTypeFee: o.order.assetTypeFee,
                        shardIdFrom: o.order.shardIdFrom,
                        shardIdTo: o.order.shardIdTo,
                        shardIdFee: o.order.shardIdFee,
                        assetQuantityFrom: o.order.assetQuantityFrom,
                        assetQuantityTo: o.order.assetQuantityTo,
                        assetQuantityFee: o.order.assetQuantityFee,
                        originOutputs: await Promise.all(
                            o.order.originOutputs.map(async originOutput => {
                                const {
                                    owner,
                                    lockScriptHash,
                                    parameters
                                } = await getOutputOwner(
                                    originOutput.tracker,
                                    originOutput.index
                                );
                                return {
                                    tracker: strip0xPrefix(
                                        originOutput.tracker
                                    ),
                                    index: originOutput.index,
                                    assetType: strip0xPrefix(
                                        originOutput.assetType
                                    ),
                                    shardId: originOutput.shardId,
                                    quantity: originOutput.quantity,
                                    owner,
                                    lockScriptHash,
                                    parameters
                                };
                            })
                        ),
                        expiration: o.order.expiration,
                        lockScriptHashFrom: strip0xPrefix(
                            o.order.lockScriptHashFrom
                        ),
                        parametersFrom: o.order.parametersFrom.map(p =>
                            strip0xPrefix(p)
                        ),
                        lockScriptHashFee: strip0xPrefix(
                            o.order.lockScriptHashFee
                        ),
                        parametersFee: o.order.parametersFee.map(p =>
                            strip0xPrefix(p)
                        )
                    },
                    inputIndices: o.inputIndices,
                    outputIndices: o.outputIndices
                };
            })
        )
    });
    await Promise.all(
        outputs.map((output, index) => {
            return createAssetTransferOutput(
                transaction.hash().value,
                transfer.tracker().value,
                AssetTransferOutput.fromJSON(output),
                index,
                {
                    networkId
                }
            );
        })
    );
    return result;
}
