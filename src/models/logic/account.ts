import { U64 } from "codechain-sdk/lib/core/classes";
import { Transaction } from "sequelize";
import models from "..";
import * as Exception from "../../exception";
import { AccountInstance } from "../account";

export async function updateAccountOrCreate(
    address: string,
    params: {
        balance: U64;
        seq: number;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<void> {
    try {
        await models.Account.upsert(
            {
                address,
                balance: params.balance.value.toString(10),
                seq: params.seq
            },
            {
                transaction: options.transaction
            }
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
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
        throw Exception.DBError();
    }
}

export async function getAccounts(params: {
    page?: number | null;
    itemsPerPage?: number | null;
}) {
    const { page = 1, itemsPerPage = 15 } = params;
    try {
        return await models.Account.findAll({
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getCountOfAccounts() {
    try {
        return await models.Account.count();
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
