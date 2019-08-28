import { U64 } from "codechain-sdk/lib/core/classes";
import { Transaction } from "sequelize";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { CCCChangeInstance, defaultAllReasons, Reason } from "../cccChanges";
import models from "../index";

async function createCCCChange(
    params: {
        address: string;
        change: U64;
        isNegative: boolean;
        blockNumber: number;
        reason: Reason;
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

export async function validatorReward(
    params: {
        address: string;
        change: U64;
        // validator reward is applied at the next term's last block.
        blockNumber: number;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<CCCChangeInstance> {
    return createCCCChange(
        {
            ...params,
            reason: "validator",
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

export async function stakeDeposit(
    params: {
        address: string;
        change: U64;
        isNegative: boolean;
        blockNumber: number;
        transactionHash?: string;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<CCCChangeInstance> {
    return createCCCChange(
        {
            ...params,
            reason: "deposit"
        },
        options
    );
}

export async function reportDoubleVote(
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
            reason: "report",
            isNegative: false
        },
        options
    );
}

export async function getByAddress(
    address: string,
    option: {
        page: number;
        itemsPerPage: number;
        reasonFilter?: string[];
    }
): Promise<CCCChangeInstance[]> {
    const { page, itemsPerPage, reasonFilter = defaultAllReasons } = option;
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
                address,
                reason: {
                    [Sequelize.Op.in]: reasonFilter
                }
            },
            include: [
                {
                    attributes: ["type"],
                    model: models.Transaction,
                    as: "transaction"
                }
            ],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [["blockNumber", "DESC"], ["id", "DESC"]]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getCountByAddress(
    address: string,
    option: {
        reasonFilter?: string[];
    }
): Promise<number> {
    const { reasonFilter = defaultAllReasons } = option;
    try {
        return models.CCCChange.count({
            where: {
                address,
                reason: {
                    [Sequelize.Op.in]: reasonFilter
                }
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByBlockNumber(
    blockNumber: number
): Promise<CCCChangeInstance[]> {
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
                blockNumber
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getNominations(
    address: string,
    blockNumber: number,
    transaction?: Transaction
): Promise<CCCChangeInstance[]> {
    try {
        return await models.CCCChange.findAll({
            attributes: ["change"],
            where: {
                address,
                blockNumber,
                reason: "deposit"
            },
            transaction
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
