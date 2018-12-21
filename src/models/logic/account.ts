import { U64 } from "codechain-sdk/lib/core/classes";
import models from "..";
import * as Exception from "../../exception";
import { AccountInstance } from "../account";

export async function updateAccountOrCreate(
    address: string,
    options: {
        balance: U64;
        seq: number;
    }
): Promise<void> {
    try {
        await models.Account.upsert({
            address,
            balance: options.balance.value.toString(10),
            seq: options.seq
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getByAddress(
    address: string
): Promise<AccountInstance | null> {
    try {
        return await models.Account.findOne({
            where: {
                address
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}