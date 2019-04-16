import { U64 } from "codechain-sdk/lib/core/classes";
import { Transaction } from "sequelize";
import * as Exception from "../../exception";
import { CCCChangeInstance } from "../cccChanges";
import models from "../index";

async function createCCCChange(
    params: {
        address: string;
        change: U64;
        isNegative: boolean;
        blockNumber: number;
        reason: "fee" | "author" | "stake" | "tx" | "initial_distribution";
        transactionHash?: string;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<CCCChangeInstance> {
    const {
        address,
        change,
        isNegative,
        blockNumber,
        reason,
        transactionHash
    } = params;
    const prefix = isNegative ? (change.isEqualTo(0) ? "" : "-") : "";
    return models.CCCChange.create(
        {
            address,
            change: `${prefix}${change.toString(10)}`,
            blockNumber,
            reason,
            transactionHash
        },
        options
    );
}

export async function payFee(
    params: {
        address: string;
        change: U64;
        blockNumber: number;
        transactionHash: string;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<CCCChangeInstance> {
    return createCCCChange(
        {
            ...params,
            reason: "fee",
            isNegative: true
        },
        options
    );
}

export async function initialDistribute(
    params: {
        address: string;
        change: U64;
        blockNumber: number;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<CCCChangeInstance> {
    return createCCCChange(
        {
            ...params,
            reason: "initial_distribution",
            isNegative: false
        },
        options
    );
}

export async function blockReward(
    params: {
        address: string;
        change: U64;
        blockNumber: number;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<CCCChangeInstance> {
    return createCCCChange(
        {
            ...params,
            reason: "author",
            isNegative: false
        },
        options
    );
}

export async function stakeReward(
    params: {
        address: string;
        change: U64;
        blockNumber: number;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<CCCChangeInstance> {
    return createCCCChange(
        {
            ...params,
            reason: "stake",
            isNegative: false
        },
        options
    );
}

export async function changeByTx(
    params: {
        address: string;
        change: U64;
        isNegative: boolean;
        blockNumber: number;
        transactionHash: string;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<CCCChangeInstance> {
    return createCCCChange(
        {
            ...params,
            reason: "tx"
        },
        options
    );
}

export async function getByAddress(
    address: string,
    option: {
        page: number;
        itemsPerPage: number;
    }
): Promise<CCCChangeInstance[]> {
    const { page, itemsPerPage } = option;
    try {
        return await models.CCCChange.findAll({
            attributes: [
                "address",
                "change",
                "blockNumber",
                "reason",
                "transactionHash"
            ],
            where: {
                address
            },
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [["blockNumber", "DESC"], ["id", "DESC"]]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
