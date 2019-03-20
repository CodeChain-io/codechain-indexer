import { SDK } from "codechain-sdk";
import { H160, H256, SignedTransaction } from "codechain-sdk/lib/core/classes";
import { AssetTransaction } from "codechain-sdk/lib/core/Transaction";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import models from "../index";
import { TransactionInstance } from "../transaction";
import { updateAssetScheme } from "./assetscheme";
import * as BlockModel from "./block";
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
import { fullIncludeArray, includeArray } from "./utils/includeArray";
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
                tracker: isAssetTransactionType(tx.unsigned.type())
                    ? strip0xPrefix(
                          ((tx.unsigned as any) as AssetTransaction).tracker()
                              .value
                      )
                    : null,
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

function isAssetTransactionType(type: string) {
    return (
        type === "mintAsset" ||
        type === "transferAsset" ||
        type === "composeAsset" ||
        type === "decomposeAsset" ||
        type === "increaseAssetSupply" ||
        type === "wrapCCC" ||
        type === "unwrapCCC"
    );
}

function getPendingTransactionsQuery(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
}) {
    const { address, assetType, type } = params;
    const query: any[] = [];
    if (address) {
        addAddressQuery(query, address);
    }
    if (assetType) {
        addAssetTypeQuery(query, assetType);
    }
    if (type) {
        query.push({
            type: {
                [Sequelize.Op.in]: type
            }
        });
    }
    query.push({
        isPending: true
    });
    return query;
}

export async function getPendingTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    page?: number | null;
    itemsPerPage?: number | null;
}) {
    const { address, assetType, type, page = 1, itemsPerPage = 15 } = params;
    const query = getPendingTransactionsQuery({ address, assetType, type });
    try {
        const hashes = await models.Transaction.findAll({
            attributes: ["hash"],
            where: {
                [Sequelize.Op.and]: query
            },
            group: ["hash"],
            order: [["pendingTimestamp", "DESC"]],
            include: includeArray
        }).then(instances => instances.map(i => strip0xPrefix(i.get().hash)));
        return await models.Transaction.findAll({
            where: {
                hash: {
                    [Sequelize.Op.in]: hashes
                }
            },
            order: [
                ["pendingTimestamp", "DESC"],
                ...transactionInOutIndexOrder
            ],
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!,
            include: fullIncludeArray
        });
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
    const query = getPendingTransactionsQuery({ address, assetType, type });
    try {
        return models.Transaction.count({
            where: {
                [Sequelize.Op.and]: query
            },
            distinct: true,
            col: "hash",
            include: includeArray
        });
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
            order: transactionInOutIndexOrder,
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
            order: [
                ["blockNumber", "DESC"],
                ["transactionIndex", "DESC"],
                ...transactionInOutIndexOrder
            ],
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

function addAddressQuery(query: any[], address: string) {
    query.push({
        [Sequelize.Op.or]: [
            { signer: address },
            { "$mintAsset.approver$": address },
            { "$mintAsset.registrar$": address },
            { "$mintAsset.recipient$": address },

            { "$transferAsset.inputs.owner$": address },
            { "$transferAsset.outputs.owner$": address },
            { "$transferAsset.burns.owner$": address },

            { "$composeAsset.approver$": address },
            { "$composeAsset.registrar$": address },
            { "$composeAsset.recipient$": address },
            { "$composeAsset.inputs.owner$": address },

            { "$decomposeAsset.input.owner$": address },
            { "$decomposeAsset.outputs.owner$": address },

            { "$wrapCCC.recipient$": address },
            { "$unwrapCCC.burn.owner$": address },

            { "$increaseAssetSupply.recipient$": address },

            { "$pay.receiver$": address }
        ]
    });
}

function addAssetTypeQuery(query: any[], assetType: H160) {
    query.push({
        [Sequelize.Op.or]: [
            { "$mintAsset.assetType$": assetType.value },
            { "$transferAsset.inputs.assetType$": assetType.value },
            { "$transferAsset.outputs.assetType$": assetType.value },
            { "$transferAsset.burns.assetType$": assetType.value },
            { "$composeAsset.inputs.assetType$": assetType.value },
            { "$decomposeAsset.input.assetType$": assetType.value },
            { "$decomposeAsset.outputs.assetType$": assetType.value },
            { "$unwrapCCC.burn.assetType$": assetType.value },
            { "$changeAssetScheme.assetType$": assetType.value },
            { "$increaseAssetSupply.assetType$": assetType.value }
        ]
    });
}

async function getTransactionsQuery(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    tracker?: H256 | null;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        type,
        tracker,
        includePending,
        onlyConfirmed,
        onlySuccessful,
        confirmThreshold
    } = params;
    const query: any[] = [];
    if (address) {
        addAddressQuery(query, address);
    }
    if (assetType) {
        addAssetTypeQuery(query, assetType);
    }
    if (type) {
        query.push({
            type: {
                [Sequelize.Op.in]: type
            }
        });
    }
    if (tracker) {
        query.push({ tracker: tracker.value });
    }
    if (onlyConfirmed) {
        const latestBlockInst = await BlockModel.getLatestBlock();
        const latestBlockNumber = latestBlockInst
            ? latestBlockInst.get().number
            : 0;
        query.push({
            blockNumber: {
                [Sequelize.Op.lte]: latestBlockNumber - confirmThreshold!
            }
        });
    }
    if (onlySuccessful) {
        query.push({
            success: true
        });
    }
    if (includePending !== true) {
        query.push({
            isPending: false
        });
    }
    return query;
}

export async function getTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    tracker?: H256 | null;
    page?: number | null;
    itemsPerPage?: number | null;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        type,
        tracker,
        page = 1,
        itemsPerPage = 15,
        includePending = false,
        onlyConfirmed = false,
        onlySuccessful = false,
        confirmThreshold = 0
    } = params;
    const query = await getTransactionsQuery({
        address,
        assetType,
        type,
        tracker,
        includePending,
        onlyConfirmed,
        onlySuccessful,
        confirmThreshold
    });
    try {
        const hashes = await models.Transaction.findAll({
            attributes: ["hash"],
            where: {
                [Sequelize.Op.and]: query
            },
            group: ["hash"],
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!,
            subQuery: false,
            include: includeArray
        }).then(instances => instances.map(i => strip0xPrefix(i.get().hash)));
        return await models.Transaction.findAll({
            where: {
                hash: {
                    [Sequelize.Op.in]: hashes
                }
            },
            order: [
                ["blockNumber", "DESC"],
                ["transactionIndex", "DESC"],
                ...transactionInOutIndexOrder
            ],
            include: fullIncludeArray
        });
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
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        type,
        tracker,
        includePending,
        onlyConfirmed = false,
        onlySuccessful = false,
        confirmThreshold = 0
    } = params;
    const query = await getTransactionsQuery({
        address,
        assetType,
        type,
        tracker,
        includePending,
        onlyConfirmed,
        onlySuccessful,
        confirmThreshold
    });
    try {
        return models.Transaction.count({
            where: {
                [Sequelize.Op.and]: query
            },
            distinct: true,
            col: "hash",
            include: includeArray
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

const transactionInOutIndexOrder = [
    [
        { as: "transferAsset", model: models.TransferAsset },
        { as: "inputs", model: models.AssetTransferInput },
        "index",
        "ASC"
    ],
    [
        { as: "transferAsset", model: models.TransferAsset },
        { as: "outputs", model: models.AssetTransferOutput },
        "index",
        "ASC"
    ],
    [
        { as: "transferAsset", model: models.TransferAsset },
        { as: "burns", model: models.AssetTransferBurn },
        "index",
        "ASC"
    ],
    [
        { as: "transferAsset", model: models.TransferAsset },
        { as: "orders", model: models.OrderOnTransfer },
        "index",
        "ASC"
    ],
    [
        { as: "composeAsset", model: models.ComposeAsset },
        { as: "inputs", model: models.AssetTransferInput },
        "index",
        "ASC"
    ],
    [
        { as: "decomposeAsset", model: models.DecomposeAsset },
        { as: "outputs", model: models.AssetTransferOutput },
        "index",
        "ASC"
    ]
];
