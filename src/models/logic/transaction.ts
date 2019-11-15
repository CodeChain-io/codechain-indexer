import * as assert from "assert";
import { SDK } from "codechain-sdk";
import { H160, H256, SignedTransaction } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import { Transaction } from "sequelize";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
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
        return models.Transaction.findAll({
            where: {
                ...query
            },
            order: [["pendingTimestamp", "DESC"]],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            include: [
                ...fullIncludeArray,
                ...buildIncludeArray({ address, assetType })
            ]
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

async function getTransactionHashes(params: {
    address?: string | null;
    assetType?: H160 | null;
    page: number;
    itemsPerPage: number;
    type?: string[] | null;
    includePending?: boolean | null;
    onlySuccessful?: boolean | null;
}): Promise<string[]> {
    const where: Sequelize.WhereOptions<TransactionAttribute> = {};
    if (params.type != null) {
        where.type = { [Sequelize.Op.in]: params.type };
    }
    if (params.onlySuccessful) {
        where.errorHint = null;
    }
    if (params.includePending !== true) {
        where.isPending = false;
    }
    const { page, itemsPerPage, address, assetType } = params;
    try {
        return await models.Transaction.findAll({
            subQuery: false,
            attributes: ["hash"],
            where,
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            ...(address || assetType
                ? {
                      group: [
                          "Transaction.hash",
                          "Transaction.blockNumber",
                          "Transaction.transactionIndex"
                      ],
                      include: buildIncludeArray({
                          address,
                          assetType
                      })
                  }
                : {})
        }).map(result => result.get("hash"));
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function getTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    page: number;
    itemsPerPage: number;
    includePending?: boolean | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const { address, assetType, itemsPerPage } = params;
    try {
        // TODO: Querying twice will waste IO bandwidth and take longer time as long as the response time
        //       Find a way to merge these queries.
        const hashes = await getTransactionHashes(params);
        assert(
            hashes.length <= itemsPerPage,
            `The number of hashes(${
                hashes.length
            })  must not be greater than itemsPerPage(${itemsPerPage})`
        );
        return models.Transaction.findAll({
            where: {
                hash: hashes,
                ...buildQueryForTransactions(params)
            },
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            include: [
                ...fullIncludeArray,
                ...buildIncludeArray({ address, assetType })
            ]
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
}) {
    try {
        const { page, itemsPerPage, blockNumber } = params;

        return models.Transaction.findAll({
            where: { blockNumber },
            order: [["transactionIndex", "DESC"]],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            include: [...fullIncludeArray]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
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

function buildQueryForTransactions(params: {
    type?: string[] | null;
    includePending?: boolean | null;
    onlySuccessful?: boolean | null;
}) {
    return {
        ...(params.type ? { type: { [Sequelize.Op.in]: params.type } } : {}),
        ...(params.onlySuccessful ? { errorHint: null } : {}),
        ...(params.includePending !== true ? { isPending: false } : {})
        /* FIXME: onlyConfirmed, confirmThreshold */
    };
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

function buildIncludeArray(params: {
    address?: string | null;
    assetType?: H160 | null;
}): Sequelize.IncludeOptions[] {
    const { address, assetType } = params;
    return [
        ...(address == null
            ? []
            : [
                  {
                      model: models.AddressLog,
                      as: "addressLogs",
                      attributes: [],
                      where: { address },
                      required: true
                  }
              ]),
        ...(assetType == null
            ? []
            : [
                  {
                      model: models.AssetTypeLog,
                      as: "assetTypeLogs",
                      attributes: [],
                      where: {
                          assetType: assetType.value
                      },
                      required: true
                  }
              ])
    ];
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
