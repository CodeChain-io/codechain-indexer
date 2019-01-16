import models from "../index";
import { PayInstance } from "../pay";

export async function createPay(
    transactionHash: string,
    amount: string,
    receiver: string
): Promise<PayInstance> {
    const numericAmount = amount.startsWith("0x") ? amount.slice(2) : amount;
    return await models.Pay.create({
        transactionHash,
        amount: numericAmount,
        receiver
    });
}
