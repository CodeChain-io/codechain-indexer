import models from "../index";
import { PayInstance } from "../pay";

export async function createPay(
    transactionHash: string,
    quantity: string,
    receiver: string
): Promise<PayInstance> {
    return await models.Pay.create({
        transactionHash,
        quantity,
        receiver
    });
}
