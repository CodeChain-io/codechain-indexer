import models from "../index";
import { PayInstance } from "../pay";
import { strip0xPrefix } from "./utils/format";

export async function createPay(
    transactionHash: string,
    quantity: string,
    receiver: string
): Promise<PayInstance> {
    return await models.Pay.create({
        transactionHash: strip0xPrefix(transactionHash),
        quantity,
        receiver
    });
}
