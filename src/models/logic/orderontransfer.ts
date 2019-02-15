import { OrderOnTransfer } from "codechain-sdk/lib/core/classes";
import { H256 } from "codechain-sdk/lib/core/classes";
import models from "..";
import * as Exception from "../../exception";
import { OrderOnTransferInstance } from "../orderontransfer";
import { createOrder } from "./order";

export async function createOrderOnTransfer(
    transactionHash: string,
    orderOnTransfer: OrderOnTransfer,
    networkId: string
): Promise<OrderOnTransferInstance> {
    let orderOnTransferInstance: OrderOnTransferInstance;
    try {
        orderOnTransferInstance = await models.OrderOnTransfer.create({
            transactionHash,
            spentQuantity: orderOnTransfer.spentQuantity.value.toString(10),
            inputIndices: orderOnTransfer.inputIndices,
            outputIndices: orderOnTransfer.outputIndices
        });

        const order = orderOnTransfer.order;
        if (await orderNotExist(order.hash())) {
            await createOrder(
                transactionHash,
                orderOnTransfer.order,
                networkId
            );
        }
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }

    return orderOnTransferInstance;
}

async function orderNotExist(orderHash: H256) {
    try {
        const order = await models.Order.findOne({
            where: {
                orderHash: orderHash.value
            }
        });
        return order == null;
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
