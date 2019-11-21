import * as assert from "assert";
import { SDK } from "codechain-sdk";
import {
    AssetAddress,
    H256,
    PlatformAddress,
    SignedTransaction
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import { Transaction } from "sequelize";
import * as Exception from "../../exception";
import {
    addressLogPagination,
    pendingTxPagination,
    txPagination
} from "../../routers/pagination";
import { blockTxPagination } from "../../routers/pagination";
import { AddressLogType } from "../addressLog";
import models from "../index";
import { TransactionAttribute, TransactionInstance } from "../transaction";
import { createAddressLog } from "./addressLog";
import { updateAssetScheme } from "./assetscheme";
import { createChangeAssetScheme } from "./changeAssetScheme";
import { createCreateShard, updateShardId } from "./createShard";
import { createCustom } from "./custom";
import { createIncreaseAssetSupply } from "./increaseassetsupply";
import { createMintAsset } from "./mintAsset";
import { createPay } from "./pay";
import { createRemove } from "./remove";
import { createSetRegularKey } from "./setRegularKey";
import { createSetShardOwners } from "./setShardOwners";
import { createSetShardUsers } from "./setShardUsers";
import { createStore } from "./store";
import { createTransferAsset } from "./transferAsset";
import { createUnwrapCCC } from "./unwrapCCC";
import { strip0xPrefix } from "./utils/format";
import { fullIncludeArray } from "./utils/includeArray";
import { getTracker, isAssetTransactionType } from "./utils/transaction";
import { getApprovers, getSigners } from "./utils/workerpool";
import { setUTXOTransactionIndex, transferUTXO } from "./utxo";
import { createWrapCCC } from "./wrapCCC";

export async function tryUpdateTransaction(
    tx: SignedTransaction,
    timestamp: number,
    options: { transaction?: Sequelize.Transaction } = {}
): Promise<TransactionInstance | null> {
    try {
        const { transaction } = options;
        const instance = await models.Transaction.findByPk(tx.hash().value, {
            transaction
        });
        if (instance == null) {
            return null;
        }

        await setUTXOTransactionIndex(
            tx.hash().toString(),
            tx.transactionIndex!,
            options
        );

        return instance.update(
            {
                blockNumber: tx.blockNumber,
                blockHash: tx.blockHash && strip0xPrefix(tx.blockHash.value),
                transactionIndex: tx.transactionIndex,
                isPending: false,
                timestamp
            },
            { transaction }
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function createTransactions(
    txs: SignedTransaction[],
    isPending: boolean,
    timestamp?: number | null,
    options: { transaction?: Sequelize.Transaction } = {}
): Promise<TransactionInstance[]> {
    try {
        const signers = await getSigners(txs, options);
        const txInstances = await models.Transaction.bulkCreate(
            txs.map((tx, i) => ({
                hash: strip0xPrefix(tx.hash().value),
                type: tx.unsigned.type(),
                blockNumber: tx.blockNumber,
                blockHash: tx.blockHash && strip0xPrefix(tx.blockHash.value),
                tracker: getTracker(tx),
                transactionIndex: tx.transactionIndex,
                seq: tx.unsigned.seq()!,
                fee: tx.unsigned.fee()!.toString(10)!,
                networkId: tx.unsigned.networkId(),
                sig: strip0xPrefix(tx.signature()),
                signer: signers[i],
                timestamp,
                isPending,
                pendingTimestamp: isPending ? +new Date() / 1000 : null
            })),
            { transaction: options.transaction }
        );
        for (const tx of txs) {
            await createTransactionAction(tx, options);
        }
        const allApprovers = await getApprovers(txs);
        await Promise.all(
            allApprovers.map(async (approvers, i) => {
                if (approvers != null) {
                    await Promise.all(
                        approvers.map(approver =>
                            createAddressLog(
                                txs[i],
                                approver,
                                "TransactionApprover",
                                options
                            )
                        )
                    );
                }
            })
        );
        await Promise.all(
            txs.map((tx, i) =>
                createAddressLog(tx, signers[i], "TransactionSigner", options)
            )
        );
        return txInstances;
    } catch (err) {
        if (err instanceof Sequelize.UniqueConstraintError) {
            const duplicateFields = (err as any).fields;
            if (_.has(duplicateFields, "hash")) {
                throw Exception.AlreadyExist();
            }
        }
        if (err.message === "InvalidTransaction") {
            throw err;
        }
        console.error(err);
        throw Exception.DBError();
    }
}

async function createTransactionAction(
    tx: SignedTransaction,
    options: { transaction?: Sequelize.Transaction } = {}
) {
    const type = tx.unsigned.type();
    switch (type) {
        case "mintAsset": {
            await createMintAsset(tx, options);
            break;
        }
        case "transferAsset": {
            await createTransferAsset(tx, options);
            break;
        }
        case "wrapCCC": {
            await createWrapCCC(tx, options);
            break;
        }
        case "unwrapCCC": {
            await createUnwrapCCC(tx, options);
            break;
        }
        case "changeAssetScheme": {
            await createChangeAssetScheme(tx, options);
            break;
        }
        case "increaseAssetSupply": {
            await createIncreaseAssetSupply(tx, options);
            break;
        }
        case "pay": {
            await createPay(tx, options);
            break;
        }
        case "setRegularKey": {
            await createSetRegularKey(tx, options);
            break;
        }
        case "createShard": {
            await createCreateShard(tx, options);
            break;
        }
        case "setShardOwners": {
            await createSetShardOwners(tx, options);
            break;
        }
        case "setShardUsers": {
            await createSetShardUsers(tx, options);
            break;
        }
        case "store": {
            await createStore(tx, options);
            break;
        }
        case "remove": {
            await createRemove(tx, options);
            break;
        }
        case "custom": {
            await createCustom(tx, options);
            break;
        }
        default:
            throw new Error(`${type} is not an expected transaction type`);
    }
}

export async function applyTransaction(
    tx: SignedTransaction,
    sdk: SDK,
    blockNumber: number,
    options: {
        transaction?: Sequelize.Transaction;
    } = {}
) {
    const type = tx.unsigned.type();
    if (isAssetTransactionType(type)) {
        await transferUTXO(
            (await getByHash(tx.hash(), options))!,
            blockNumber!,
            options
        );
    }
    if (type === "createShard") {
        await updateShardId(
            (await getByHash(tx.hash(), options))!,
            sdk,
            options
        );
    }
    if (
        type === "changeAssetScheme" ||
        type === "increaseAssetSupply" ||
        type === "transferAsset" ||
        type === "wrapCCC" ||
        type === "unwrapCCC"
    ) {
        await updateAssetScheme(
            (await getByHash(tx.hash(), options))!,
            options
        );
    }
}

export async function getPendingTransactions(params: {
    address?: string | null;
    page: number;
    itemsPerPage: number;
    firstEvaluatedKey: [number, number] | null;
    lastEvaluatedKey: [number, number] | null;
}) {
    const { address } = params;

    if (address) {
        return getPendingTransactionsByAddress({
            ...params,
            ...{
                address
            }
        });
    } else {
        return getAnyPendingTransactions(params);
    }
}

async function getAnyPendingTransactions(params: {
    page: number;
    itemsPerPage: number;
    firstEvaluatedKey: [number, number] | null;
    lastEvaluatedKey: [number, number] | null;
}) {
    const { page, itemsPerPage, firstEvaluatedKey, lastEvaluatedKey } = params;
    const query: any[] = [
        {
            isPending: true
        }
    ];

    if (firstEvaluatedKey || lastEvaluatedKey) {
        query.push(
            pendingTxPagination.where({
                firstEvaluatedKey,
                lastEvaluatedKey
            })
        );
    }

    try {
        return models.Transaction.findAll({
            where: {
                [Sequelize.Op.and]: query
            },
            order: pendingTxPagination.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            limit: itemsPerPage,
            offset:
                firstEvaluatedKey || lastEvaluatedKey
                    ? 0
                    : (page - 1) * itemsPerPage,
            include: [...fullIncludeArray]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

async function getPendingTransactionsByAddress(params: {
    address: string;
    page: number;
    itemsPerPage: number;
    firstEvaluatedKey: [number, number] | null;
    lastEvaluatedKey: [number, number] | null;
}) {
    const { itemsPerPage, firstEvaluatedKey, lastEvaluatedKey } = params;

    const hashes = await getPendingHashesByPlatformAddress(params);
    assert(
        hashes.length <= itemsPerPage,
        `The number of hashes(${
            hashes.length
        })  must not be greater than itemsPerPage(${itemsPerPage})`
    );
    try {
        return models.Transaction.findAll({
            where: {
                hash: hashes
            },
            order: addressLogPagination.bySeq.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            limit: itemsPerPage,
            include: [...fullIncludeArray]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

async function getPendingHashesByPlatformAddress(params: {
    address: string;
    page: number;
    itemsPerPage: number;
    firstEvaluatedKey: [number, number] | null;
    lastEvaluatedKey: [number, number] | null;
}): Promise<string[]> {
    const {
        address,
        page,
        itemsPerPage,
        firstEvaluatedKey,
        lastEvaluatedKey
    } = params;

    const addressLogType: AddressLogType = "TransactionSigner";
    const whereCond: any[] = [
        {
            address,
            isPending: true,
            type: addressLogType
        }
    ];
    if (firstEvaluatedKey || lastEvaluatedKey) {
        whereCond.push(
            addressLogPagination.bySeq.where({
                firstEvaluatedKey,
                lastEvaluatedKey
            })
        );
    }
    try {
        return models.AddressLog.findAll({
            attributes: ["transactionHash"],
            where: {
                [Sequelize.Op.and]: whereCond
            },
            order: addressLogPagination.bySeq.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            limit: itemsPerPage,
            offset:
                firstEvaluatedKey || lastEvaluatedKey
                    ? 0
                    : (page - 1) * itemsPerPage
        }).map(r => r.get("transactionHash"));
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getAllPendingTransactionHashes() {
    try {
        return models.Transaction.findAll({
            attributes: ["hash"],
            where: {
                isPending: true
            },
            order: [["pendingTimestamp", "DESC"]]
        }).then(instances => instances.map(i => i.get().hash));
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByHash(
    hash: H256,
    options: { transaction?: Sequelize.Transaction } = {}
): Promise<TransactionInstance | null> {
    try {
        return await models.Transaction.findOne({
            where: {
                hash: strip0xPrefix(hash.value)
            },
            include: fullIncludeArray,
            transaction: options.transaction
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByTracker(
    tracker: H256
): Promise<TransactionInstance[]> {
    try {
        return models.Transaction.findAll({
            where: {
                tracker: strip0xPrefix(tracker.toString())
            },
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            include: fullIncludeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function checkIfHashExists(hash: H256): Promise<boolean> {
    try {
        return models.Transaction.findOne({
            attributes: [],
            where: {
                hash: strip0xPrefix(hash.value)
            }
        }).then(instance => instance != null);
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function removePendings(hashes: H256[]): Promise<void> {
    try {
        await models.Transaction.destroy({
            where: {
                hash: {
                    [Sequelize.Op.in]: hashes.map(h => strip0xPrefix(h.value))
                },
                isPending: true
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function removeOutdatedPendings(
    updatedTransactions: SignedTransaction[]
): Promise<void> {
    try {
        await models.Transaction.destroy({
            where: {
                [Sequelize.Op.and]: [
                    { isPending: true },
                    {
                        [Sequelize.Op.or]: updatedTransactions.map(i => ({
                            [Sequelize.Op.and]: [
                                {
                                    seq: i.toJSON().seq,
                                    signer: i.getSignerAddress({
                                        networkId: i.toJSON().networkId
                                    }).value
                                },
                                {
                                    [Sequelize.Op.not]: {
                                        hash: strip0xPrefix(i.hash().value)
                                    }
                                }
                            ]
                        }))
                    }
                ]
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

async function getHashesByPlatformAddress(params: {
    address: string;
    page: number;
    itemsPerPage: number;
    firstEvaluatedKey: [number, number] | null;
    lastEvaluatedKey: [number, number] | null;
    includePending: boolean | null;
}): Promise<string[]> {
    const {
        address,
        page,
        itemsPerPage,
        firstEvaluatedKey,
        lastEvaluatedKey
    } = params;

    const whereCond: any[] = [
        {
            address,
            ...(params.includePending !== true ? { isPending: false } : {})
        }
    ];
    if (firstEvaluatedKey || lastEvaluatedKey) {
        whereCond.push(
            txPagination.where({
                firstEvaluatedKey,
                lastEvaluatedKey
            })
        );
    }
    try {
        return models.AddressLog.findAll({
            attributes: ["transactionHash"],
            where: {
                [Sequelize.Op.and]: whereCond
            },
            order: txPagination.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            limit: itemsPerPage,
            offset:
                firstEvaluatedKey || lastEvaluatedKey
                    ? 0
                    : (page - 1) * itemsPerPage
        }).map(r => r.get("transactionHash"));
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

async function getHashesByAssetAddress(params: {
    address: string;
    assetType?: string | null;
    page: number;
    itemsPerPage: number;
    firstEvaluatedKey: [number, number] | null;
    lastEvaluatedKey: [number, number] | null;
    includePending: boolean | null;
}): Promise<string[]> {
    const {
        address,
        assetType,
        page,
        itemsPerPage,
        firstEvaluatedKey,
        lastEvaluatedKey
    } = params;

    const whereCond: any[] = [
        {
            address,
            ...(assetType && { assetType }),
            ...(params.includePending !== true ? { isPending: false } : {})
        }
    ];
    if (firstEvaluatedKey || lastEvaluatedKey) {
        whereCond.push(
            txPagination.where({
                firstEvaluatedKey,
                lastEvaluatedKey
            })
        );
    }

    try {
        return models.AssetAddressLog.findAll({
            attributes: ["transactionHash"],
            where: {
                [Sequelize.Op.and]: whereCond
            },
            order: txPagination.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            limit: itemsPerPage,
            offset:
                firstEvaluatedKey || lastEvaluatedKey
                    ? 0
                    : (page - 1) * itemsPerPage
        }).map(r => r.get("transactionHash"));
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

async function getHashesByAssetType(params: {
    assetType: string;
    page: number;
    itemsPerPage: number;
    firstEvaluatedKey: [number, number] | null;
    lastEvaluatedKey: [number, number] | null;
    includePending: boolean | null;
}): Promise<string[]> {
    const {
        assetType,
        page,
        itemsPerPage,
        firstEvaluatedKey,
        lastEvaluatedKey
    } = params;

    const whereCond: any[] = [
        {
            assetType,
            ...(params.includePending !== true ? { isPending: false } : {})
        }
    ];
    if (firstEvaluatedKey || lastEvaluatedKey) {
        whereCond.push(
            txPagination.where({
                firstEvaluatedKey,
                lastEvaluatedKey
            })
        );
    }

    try {
        return models.AssetTypeLog.findAll({
            attributes: ["transactionHash"],
            where: {
                [Sequelize.Op.and]: whereCond
            },
            order: txPagination.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            limit: itemsPerPage,
            offset:
                firstEvaluatedKey || lastEvaluatedKey
                    ? 0
                    : (page - 1) * itemsPerPage
        }).map(r => r.get("transactionHash"));
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

async function getHashes(params: {
    address?: string | null;
    assetType?: string | null;
    page: number;
    itemsPerPage: number;
    firstEvaluatedKey: [number, number] | null;
    lastEvaluatedKey: [number, number] | null;
    type?: string[] | null;
    includePending?: boolean | null;
}): Promise<string[]> {
    const {
        address,
        assetType,
        page,
        itemsPerPage,
        firstEvaluatedKey,
        lastEvaluatedKey,
        includePending = null
    } = params;
    if (address != null && assetType != null) {
        return getHashesByAssetAddress({
            address,
            assetType,
            page,
            itemsPerPage,
            firstEvaluatedKey,
            lastEvaluatedKey,
            includePending
        });
    } else if (address != null) {
        if (AssetAddress.check(address)) {
            return getHashesByAssetAddress({
                address,
                page,
                itemsPerPage,
                firstEvaluatedKey,
                lastEvaluatedKey,
                includePending
            });
        } else if (PlatformAddress.check(address)) {
            return getHashesByPlatformAddress({
                address,
                page,
                itemsPerPage,
                firstEvaluatedKey,
                lastEvaluatedKey,
                includePending
            });
        }
        throw Error(`Invalid address: ${address}`);
    } else if (assetType != null) {
        return getHashesByAssetType({
            assetType,
            page,
            itemsPerPage,
            firstEvaluatedKey,
            lastEvaluatedKey,
            includePending
        });
    }
    const whereCond: any[] = [
        {
            ...(params.type != null
                ? { type: { [Sequelize.Op.in]: params.type } }
                : {}),
            ...(params.includePending !== true ? { isPending: false } : {})
        }
    ];
    if (firstEvaluatedKey || lastEvaluatedKey) {
        whereCond.push(
            txPagination.where({
                firstEvaluatedKey,
                lastEvaluatedKey
            })
        );
    }
    return models.Transaction.findAll({
        attributes: ["hash"],
        where: {
            [Sequelize.Op.and]: whereCond
        },
        order: txPagination.orderby({
            firstEvaluatedKey,
            lastEvaluatedKey
        }),
        limit: itemsPerPage,
        offset:
            firstEvaluatedKey || lastEvaluatedKey
                ? 0
                : (page - 1) * itemsPerPage
    }).map(result => result.get("hash"));
}

export async function getTransactions(params: {
    address?: string | null;
    assetType?: string | null;
    type?: string[] | null;
    page: number;
    itemsPerPage: number;
    firstEvaluatedKey: [number, number] | null;
    lastEvaluatedKey: [number, number] | null;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const { itemsPerPage, firstEvaluatedKey, lastEvaluatedKey } = params;
    try {
        // TODO: Querying twice will waste IO bandwidth and take longer time as long as the response time
        //       Find a way to merge these queries.
        const hashes = await getHashes(params);
        assert(
            hashes.length <= itemsPerPage,
            `The number of hashes(${
                hashes.length
            })  must not be greater than itemsPerPage(${itemsPerPage})`
        );
        return models.Transaction.findAll({
            where: {
                hash: hashes
            },
            order: txPagination.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            include: [...fullIncludeArray]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getTransactionsOfBlock(params: {
    page: number;
    itemsPerPage: number;
    blockNumber: number;
    firstEvaluatedKey?: number[] | null;
    lastEvaluatedKey?: number[] | null;
}) {
    try {
        const {
            page,
            itemsPerPage,
            blockNumber,
            firstEvaluatedKey,
            lastEvaluatedKey
        } = params;

        const whereCond: any[] = [{ blockNumber }];
        if (firstEvaluatedKey || lastEvaluatedKey) {
            whereCond.push(
                blockTxPagination.where({
                    firstEvaluatedKey,
                    lastEvaluatedKey
                })
            );
        }

        return models.Transaction.findAll({
            where: {
                [Sequelize.Op.and]: whereCond
            },
            order: blockTxPagination.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            limit: itemsPerPage,
            offset:
                firstEvaluatedKey || lastEvaluatedKey
                    ? 0
                    : (page - 1) * itemsPerPage,
            include: [...fullIncludeArray]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export function createBlockTxEvaluatedKey(tx: TransactionAttribute) {
    return JSON.stringify([tx.transactionIndex]);
}

export async function getNumberOfEachTransactionType(
    params: {
        blockNumber: number;
    },
    options: {
        transaction?: Sequelize.Transaction;
    } = {}
) {
    try {
        const { transaction } = options;
        return models.Transaction.findAll({
            where: { blockNumber: params.blockNumber },
            group: ["type"],
            attributes: ["type", [Sequelize.fn("COUNT", "type"), "count"]],
            transaction
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

// @ts-ignore
export async function deleteByHash(hash: H256) {
    try {
        return await models.Transaction.destroy({
            where: { hash: strip0xPrefix(hash.value) }
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError();
    }
}

export async function getSuccessfulByTracker(
    tracker: H256,
    options: {
        transaction?: Sequelize.Transaction;
    } = {}
): Promise<TransactionInstance | null> {
    try {
        return await models.Transaction.findOne({
            where: {
                tracker: strip0xPrefix(tracker.toString()),
                isPending: false
            },
            transaction: options.transaction
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getRegularKeyOwnerByPublicKey(
    pubkey: string,
    options: { transaction?: Transaction; blockNumber?: number }
): Promise<string | null> {
    const where: any =
        options.blockNumber != null
            ? {
                  blockNumber: {
                      [Sequelize.Op.lte]: options.blockNumber
                  }
              }
            : undefined;
    const tx = await models.Transaction.findOne({
        include: [
            {
                model: models.SetRegularKey,
                as: "setRegularKey",
                where: {
                    key: strip0xPrefix(pubkey)
                }
            }
        ],
        order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
        where,
        transaction: options.transaction
    });
    if (tx == null) {
        return null;
    }
    return tx.get("signer");
}

export function createTxEvaluatedKey(tx: TransactionAttribute) {
    return JSON.stringify([tx.blockNumber, tx.transactionIndex]);
}

export function createPendingTxEvaluatedKey(tx: TransactionAttribute) {
    return JSON.stringify([tx.pendingTimestamp]);
}
