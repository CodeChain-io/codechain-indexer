import {
    H160,
    Order,
    SignedTransaction,
    U64
} from "codechain-sdk/lib/core/classes";
import {
    TransferAsset,
    TransferAssetActionJSON
} from "codechain-sdk/lib/core/transaction/TransferAsset";
import * as _ from "lodash";
import models from "../index";
import { TransferAssetInstance } from "../transferAsset";
import { createAddressLog } from "./addressLog";
import { getOutputOwner } from "./assettransferoutput";
import { createAssetTypeLog } from "./assetTypeLog";
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
                        quantity: new U64(i.prevOut.quantity).toString(),
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
                        quantity: new U64(b.prevOut.quantity).toString(),
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
                quantity: new U64(o.quantity).toString(),
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
                    spentQuantity: new U64(o.spentQuantity).toString(),
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
                        assetQuantityFrom: new U64(
                            o.order.assetQuantityFrom
                        ).toString(),
                        assetQuantityTo: new U64(
                            o.order.assetQuantityTo
                        ).toString(),
                        assetQuantityFee: new U64(
                            o.order.assetQuantityFee
                        ).toString(),
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
                                    quantity: new U64(
                                        originOutput.quantity
                                    ).toString(),
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
    const {
        inputs: resultInputs,
        burns: resultBurns,
        outputs: resultOutputs
    } = result.get({ plain: true });
    const addresses: string[] = _.uniq([
        ..._.uniq(
            resultInputs.filter(i => i.prevOut.owner).map(i => i.prevOut.owner!)
        ),
        ..._.uniq(
            resultBurns.filter(b => b.prevOut.owner).map(b => b.prevOut.owner!)
        ),
        ..._.uniq(resultOutputs.filter(o => o.owner).map(o => o.owner!))
    ]);
    await Promise.all(
        addresses.map(address =>
            createAddressLog(transaction, address, "AssetOwner")
        )
    );
    // FIXME: Log the addresses in orders.
    const assetTypes: string[] = _.uniq([
        ..._.uniq(resultInputs.map(i => i.assetType)),
        ..._.uniq(resultBurns.map(b => b.assetType)),
        ..._.uniq(resultOutputs.map(o => o.assetType))
    ]);
    await Promise.all(
        assetTypes.map(assetType => createAssetTypeLog(transaction, assetType))
    );
    return result;
}
