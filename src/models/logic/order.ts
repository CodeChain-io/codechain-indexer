import { AssetOutPoint, Order } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetOutPointAttribute } from "../assettransferinput";
import models from "../index";
import { OrderInstance } from "../order";
import * as AddressUtil from "./utils/address";

export async function createOrder(
    transactionHash: string,
    order: Order,
    networkId: string
): Promise<OrderInstance> {
    let orderInstance: OrderInstance;
    try {
        const originOutputs = await Promise.all(
            order.originOutputs.map(async (out: AssetOutPoint) => {
                const outParameters = out.parameters;
                const parameters = outParameters
                    ? outParameters.map(p => p.toString("hex"))
                    : [];
                const owner =
                    out.lockScriptHash &&
                    outParameters &&
                    AddressUtil.getOwner(
                        out.lockScriptHash,
                        parameters,
                        networkId
                    );
                const result: AssetOutPointAttribute = {
                    tracker: out.tracker.value,
                    index: out.index,
                    assetType: out.assetType.value,
                    shardId: out.shardId,
                    quantity: out.quantity.value.toString(10),
                    owner,
                    lockScriptHash:
                        out.lockScriptHash && out.lockScriptHash.value,
                    parameters
                };

                return result;
            })
        );

        orderInstance = await models.Order.create({
            orderHash: order.hash().value,
            transactionHash,
            assetTypeFrom: order.assetTypeFrom.value,
            assetTypeTo: order.assetTypeTo.value,
            assetTypeFee: order.assetTypeFee.value,
            shardIdFrom: order.shardIdFrom,
            shardIdTo: order.shardIdTo,
            shardIdFee: order.shardIdFee,
            originOutputs,
            assetQuantityFrom: order.assetQuantityFrom.value.toString(10),
            assetQuantityTo: order.assetQuantityTo.value.toString(10),
            assetQuantityFee: order.assetQuantityFee.value.toString(10),
            expiration: order.expiration.value.toString(10),
            lockScriptHashFrom: order.lockScriptHashFrom.value,
            parametersFrom: order.parametersFrom.map(p => p.toString("hex")),
            lockScriptHashFee: order.lockScriptHashFee.value,
            parametersFee: order.parametersFee.map(p => p.toString("hex"))
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return orderInstance;
}
