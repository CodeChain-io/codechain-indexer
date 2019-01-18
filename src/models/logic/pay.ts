import models from "../index";
import { PayInstance } from "../pay";

export async function createPay(
    transactionHash: string,
    quantity: string,
    receiver: string
): Promise<PayInstance> {
    const numericQuantity = quantity.startsWith("0x")
        ? quantity.slice(2)
        : quantity;
    return await models.Pay.create({
        transactionHash,
        quantity: numericQuantity,
        receiver
    });
}
