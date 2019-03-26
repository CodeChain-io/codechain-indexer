import { SDK } from "codechain-sdk";
import { H160, H256, SignedTransaction } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import models from "../index";
import { TransactionInstance } from "../transaction";
import { createAddressLog } from "./addressLog";
import { updateAssetScheme } from "./assetscheme";
import { createChangeAssetScheme } from "./changeAssetScheme";
import { createComposeAsset } from "./composeAsset";
import { createCreateShard, updateShardId } from "./createShard";
import { createCustom } from "./custom";
import { createDecomposeAsset } from "./decomposeAsset";
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
import { getSigners } from "./utils/workerpool";
import { transferUTXO } from "./utxo";
import { createWrapCCC } from "./wrapCCC";

export async function createTransactions(
    txs: SignedTransaction[],
    isPending: boolean,
    timestamp?: number | null,
    errorHints?: { [transactionIndex: number]: string } | null
): Promise<TransactionInstance[]> {
    try {
        const signers = await getSigners(txs);
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
                success: tx.result,
                errorHint:
                    errorHints == null
                        ? undefined
                        : errorHints[tx.transactionIndex!],
                timestamp,
                isPending,
                pendingTimestamp: isPending ? +new Date() / 1000 : null
            }))
        );
        for (const tx of txs) {
            await createTransactionAction(tx);
        }
        await Promise.all(
            txs.map((tx, i) =>
                createAddressLog(tx, signers[i], "TransactionSigner")
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

async function createTransactionAction(tx: SignedTransaction) {
    const type = tx.unsigned.type();
    switch (type) {
        case "mintAsset": {
            await createMintAsset(tx);
            break;
        }
        case "transferAsset": {
            await createTransferAsset(tx);
            break;
        }
        case "composeAsset": {
            await createComposeAsset(tx);
            break;
        }
        case "decomposeAsset": {
            await createDecomposeAsset(tx);
            break;
        }
        case "wrapCCC": {
            await createWrapCCC(tx);
            break;
        }
        case "unwrapCCC": {
            await createUnwrapCCC(tx);
            break;
        }
        case "changeAssetScheme": {
            await createChangeAssetScheme(tx);
            break;
        }
        case "increaseAssetSupply": {
            await createIncreaseAssetSupply(tx);
            break;
        }
        case "pay": {
            await createPay(tx);
            break;
        }
        case "setRegularKey": {
            await createSetRegularKey(tx);
            break;
        }
        case "createShard": {
            await createCreateShard(tx);
            break;
        }
        case "setShardOwners": {
            await createSetShardOwners(tx);
            break;
        }
        case "setShardUsers": {
            await createSetShardUsers(tx);
            break;
        }
        case "store": {
            await createStore(tx);
            break;
        }
        case "remove": {
            await createRemove(tx);
            break;
        }
        case "custom": {
            await createCustom(tx);
            break;
        }
        default:
            throw new Error(`${type} is not an expected transaction type`);
    }
}

export async function applyTransaction(
    tx: SignedTransaction,
    sdk: SDK,
    blockNumber: number
) {
    const type = tx.unsigned.type();
    if (isAssetTransactionType(type)) {
        await transferUTXO((await getByHash(tx.hash()))!, blockNumber!);
    }
    if (type === "createShard") {
        await updateShardId((await getByHash(tx.hash()))!, sdk);
    }
    if (type === "changeAssetScheme" || type === "increaseAssetSupply") {
        await updateAssetScheme((await getByHash(tx.hash()))!);
    }
}

export async function getPendingTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    page: number;
    itemsPerPage: number;
}) {
    const { address, assetType, type, page, itemsPerPage } = params;
    const query = {
        isPending: true,
        ...(type == null
            ? {}
            : {
                  [Sequelize.Op.in]: type
              })
    };
    try {
        if (address) {
            return models.AddressLog.findAll({
                attributes: ["transactionHash"],
                where: {
                    ...query,
                    address
                },
                group: ["transactionHash", "blockNumber", "transactionIndex"],
                limit: itemsPerPage,
                offset: (page - 1) * itemsPerPage
            })
                .then(instances => instances.map(i => i.get().transactionHash))
                .then(hashes =>
                    models.Transaction.findAll({
                        where: {
                            hash: {
                                [Sequelize.Op.in]: hashes
                            }
                        },
                        include: fullIncludeArray
                    })
                );
        } else if (assetType) {
            return models.AssetTypeLog.findAll({
                attributes: ["transactionHash"],
                where: {
                    ...query,
                    assetType: assetType.toString()
                },
                group: ["transactionHash", "blockNumber", "transactionIndex"],
                limit: itemsPerPage,
                offset: (page - 1) * itemsPerPage
            })
                .then(instances => instances.map(i => i.get().transactionHash))
                .then(hashes =>
                    models.Transaction.findAll({
                        where: {
                            hash: {
                                [Sequelize.Op.in]: hashes
                            }
                        },
                        include: fullIncludeArray
                    })
                );
        } else {
            return models.Transaction.findAll({
                where: {
                    ...query
                },
                order: [["pendingTimestamp", "DESC"]],
                limit: itemsPerPage,
                offset: (page - 1) * itemsPerPage,
                include: fullIncludeArray
            });
        }
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

export async function getNumberOfPendingTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
}) {
    const { address, assetType, type } = params;
    const query = {
        isPending: true,
        ...(type == null
            ? {}
            : {
                  [Sequelize.Op.in]: type
              })
    };
    try {
        if (address) {
            return models.AddressLog.count({
                where: {
                    ...query,
                    address
                },
                distinct: true,
                col: "transactionHash"
            });
        } else if (assetType) {
            return models.AssetTypeLog.count({
                where: {
                    ...query,
                    assetType: assetType.value
                },
                distinct: true,
                col: "transactionHash"
            });
        } else {
            return models.Transaction.count({
                where: query
            });
        }
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByHash(
    hash: H256
): Promise<TransactionInstance | null> {
    try {
        return await models.Transaction.findOne({
            where: {
                hash: strip0xPrefix(hash.value)
            },
            include: fullIncludeArray
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

export async function getTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    tracker?: H256 | null;
    blockNumber?: number | null;
    blockHash?: H256 | null;
    page: number;
    itemsPerPage: number;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const { address, assetType, page, itemsPerPage } = params;
    try {
        if (address) {
            return getTransactionsByAddress({ ...params, address });
        } else if (assetType) {
            return getTransactionsByAssetType({ ...params, assetType });
        }
        return models.Transaction.findAll({
            where: {
                ...buildQueryForTransactions(params)
            },
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            include: fullIncludeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getTransactionsByAddress(params: {
    address: string;
    type?: string[] | null;
    tracker?: H256 | null;
    blockNumber?: number | null;
    blockHash?: H256 | null;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
    page: number;
    itemsPerPage: number;
}) {
    try {
        const { address, page, itemsPerPage } = params;
        return models.AddressLog.findAll({
            attributes: ["transactionHash"],
            where: {
                ...buildQueryForLogs(params),
                address
            },
            group: ["transactionHash", "blockNumber", "transactionIndex"],
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage
        })
            .then(instances => instances.map(i => i.get().transactionHash))
            .then(hashes =>
                models.Transaction.findAll({
                    where: {
                        hash: {
                            [Sequelize.Op.in]: hashes
                        }
                    },
                    order: [
                        ["blockNumber", "DESC"],
                        ["transactionIndex", "DESC"]
                    ],
                    include: fullIncludeArray
                })
            );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getTransactionsByAssetType(params: {
    assetType: H160;
    type?: string[] | null;
    tracker?: H256 | null;
    blockNumber?: number | null;
    blockHash?: H256 | null;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
    page: number;
    itemsPerPage: number;
}) {
    try {
        const { assetType, page, itemsPerPage } = params;
        return models.AssetTypeLog.findAll({
            attributes: ["transactionHash"],
            where: {
                ...buildQueryForLogs(params),
                assetType: assetType.value
            },
            group: ["transactionHash", "blockNumber", "transactionIndex"],
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage
        })
            .then(instances => instances.map(i => i.get().transactionHash))
            .then(hashes =>
                models.Transaction.findAll({
                    where: {
                        hash: {
                            [Sequelize.Op.in]: hashes
                        }
                    },
                    order: [
                        ["blockNumber", "DESC"],
                        ["transactionIndex", "DESC"]
                    ],
                    include: fullIncludeArray
                })
            );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getNumberOfTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    tracker?: H256 | null;
    blockNumber?: number | null;
    blockHash?: H256 | null;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    if (params.address != null) {
        return getNumberOfTransactionsByAddress({
            ...params,
            address: params.address
        });
    }
    if (params.assetType != null) {
        return getNumberOfTransactionsByAssetType({
            ...params,
            assetType: params.assetType
        });
    }
    try {
        return models.Transaction.count({
            where: {
                ...buildQueryForTransactions(params)
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

function buildQueryForTransactions(params: {
    type?: string[] | null;
    tracker?: H256 | null;
    blockNumber?: number | null;
    blockHash?: H256 | null;
    includePending?: boolean | null;
    onlySuccessful?: boolean | null;
}) {
    return {
        ...(params.type ? { type: { [Sequelize.Op.in]: params.type } } : {}),
        ...(params.tracker ? { tracker: params.tracker.value } : {}),
        ...(params.blockNumber ? { blockNumber: params.blockNumber } : {}),
        ...(params.blockHash
            ? {
                  blockHash: params.blockHash.value
              }
            : {}),
        ...(params.onlySuccessful ? { success: true } : {}),
        ...(params.includePending !== true ? { isPending: false } : {})
        /* FIXME: onlyConfirmed, confirmThreshold */
    };
}

function buildQueryForLogs(params: {
    type?: string[] | null;
    tracker?: H256 | null;
    blockNumber?: number | null;
    blockHash?: H256 | null;
    includePending?: boolean | null;
    onlySuccessful?: boolean | null;
}) {
    return {
        ...(params.type
            ? { transactionType: { [Sequelize.Op.in]: params.type } }
            : {}),
        ...(params.tracker ? { transactionTracker: params.tracker.value } : {}),
        ...(params.blockNumber ? { blockNumber: params.blockNumber } : {}),
        ...(params.blockHash
            ? {
                  /* FIXME */
              }
            : {}),
        ...(params.onlySuccessful ? { success: true } : {}),
        ...(params.includePending !== true ? { isPending: false } : {})
        /* FIXME: onlyConfirmed, confirmThreshold */
    };
}

export async function getNumberOfTransactionsByAddress(params: {
    address: string;
    type?: string[] | null;
    tracker?: H256 | null;
    blockNumber?: number | null;
    blockHash?: H256 | null;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    return models.AddressLog.count({
        where: {
            ...buildQueryForLogs(params),
            address: params.address!
        },
        distinct: true,
        col: "transactionHash"
    });
}

export async function getNumberOfTransactionsByAssetType(params: {
    assetType: H160;
    type?: string[] | null;
    tracker?: H256 | null;
    blockNumber?: number | null;
    blockHash?: H256 | null;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    return models.AssetTypeLog.count({
        where: {
            ...buildQueryForLogs(params),
            assetType: params.assetType!.value
        },
        distinct: true,
        col: "transactionHash"
    });
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
    tracker: H256
): Promise<TransactionInstance | null> {
    try {
        return await models.Transaction.findOne({
            where: {
                tracker: strip0xPrefix(tracker.toString()),
                success: true
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
