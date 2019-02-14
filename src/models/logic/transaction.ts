import {
    ChangeAssetScheme,
    ComposeAsset,
    DecomposeAsset,
    H160,
    H256,
    MintAsset,
    SignedTransaction,
    TransferAsset,
    U64,
    UnwrapCCC,
    WrapCCC
} from "codechain-sdk/lib/core/classes";
import { AssetTransaction } from "codechain-sdk/lib/core/Transaction";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { AssetTransferOutputAttribute } from "../assettransferoutput";
import models from "../index";
import { TransactionInstance } from "../transaction";
import * as BlockModel from "./block";
import { createChangeAssetScheme } from "./changeAssetScheme";
import { createComposeAsset } from "./composeAsset";
import { createCustom } from "./custom";
import { createDecomposeAsset } from "./decomposeAsset";
import { createMintAsset } from "./mintAsset";
import { createPay } from "./pay";
import { createRemove } from "./remove";
import { createSetRegularKey } from "./setRegularKey";
import { createSetShardOwners } from "./setShardOwners";
import { createSetShardUsers } from "./setShardUsers";
import { createStore } from "./store";
import { createTransferAsset } from "./transferAsset";
import { createUnwrapCCC } from "./unwrapCCC";
import { getOwner } from "./utils/address";
import { createUTXO, getByTxHashIndex, setUsed } from "./utxo";
import { createWrapCCC } from "./wrapCCC";

export async function createTransaction(
    tx: SignedTransaction,
    isPending: boolean,
    params?: {
        timestamp?: number | null;
        success?: boolean | null;
        errorHint?: string;
    } | null
): Promise<TransactionInstance> {
    const { timestamp = null, success = null } = params || {};
    const errorHint = params ? params.errorHint : undefined;
    try {
        const type = tx.unsigned.type();
        const hash = tx.hash().value;
        // FIXME: Add a method to SDK
        const isAssetTransaction =
            type === "mintAsset" ||
            type === "transferAsset" ||
            type === "composeAsset" ||
            type === "decomposeAsset" ||
            type === "wrapCCC" ||
            type === "unwrapCCC";
        const tracker = isAssetTransaction
            ? ((tx.unsigned as any) as AssetTransaction).tracker().value
            : null;
        const txInstance = await models.Transaction.create({
            hash,
            type,
            blockNumber: tx.blockNumber,
            blockHash: tx.blockHash && tx.blockHash.value,
            tracker,
            transactionIndex: tx.transactionIndex,
            seq: tx.unsigned.seq()!,
            fee: tx.unsigned.fee()!.toString(10)!,
            networkId: tx.unsigned.networkId(),
            sig: tx.toJSON().sig,
            signer: tx.getSignerAddress({
                networkId: tx.unsigned.networkId()
            }).value,
            success,
            errorHint,
            timestamp,
            isPending,
            pendingTimestamp: isPending ? +new Date() / 1000 : null
        });
        switch (type) {
            case "mintAsset": {
                const mintAsset = tx.unsigned as MintAsset;
                await createMintAsset(
                    hash,
                    mintAsset.getMintedAsset(),
                    mintAsset.getAssetScheme(),
                    tx.toJSON().action
                );
                break;
            }
            case "transferAsset": {
                const transferAsset = tx.unsigned as TransferAsset;
                await createTransferAsset(
                    hash,
                    transferAsset,
                    tx.toJSON().action
                );
                break;
            }
            case "composeAsset": {
                const composeAsset = tx.unsigned as ComposeAsset;
                await createComposeAsset(
                    hash,
                    composeAsset,
                    tx.toJSON().action
                );
                break;
            }
            case "decomposeAsset": {
                const decomposeAsset = tx.unsigned as DecomposeAsset;
                await createDecomposeAsset(
                    hash,
                    decomposeAsset,
                    tx.toJSON().action
                );
                break;
            }
            case "wrapCCC": {
                const wrap = tx.unsigned as WrapCCC;
                await createWrapCCC(hash, wrap.toJSON().action);
                break;
            }
            case "unwrapCCC": {
                const unwrap = tx.unsigned as UnwrapCCC;
                await createUnwrapCCC(hash, unwrap, tx.unsigned.networkId());
                break;
            }
            case "changeAssetScheme": {
                const changeAssetScheme = tx.unsigned as ChangeAssetScheme;
                await createChangeAssetScheme(hash, changeAssetScheme);
                break;
            }
            case "pay": {
                const { quantity, receiver } = tx.toJSON().action;
                await createPay(hash, new U64(quantity).toString(10), receiver);
                break;
            }
            case "setRegularKey": {
                const { key } = tx.toJSON().action;
                await createSetRegularKey(hash, key);
                break;
            }
            case "setShardOwners": {
                const { shardId, owners } = tx.toJSON().action;
                await createSetShardOwners(hash, shardId, owners);
                break;
            }
            case "setShardUsers": {
                const { shardId, users } = tx.toJSON().action;
                await createSetShardUsers(hash, shardId, users);
                break;
            }
            case "store": {
                const { content, certifier, signature } = tx.toJSON().action;
                await createStore(hash, content, certifier, signature);
                break;
            }
            case "remove": {
                const action = tx.toJSON().action;
                await createRemove(hash, action.hash, action.signature);
                break;
            }
            case "custom": {
                const { handleId, buffer } = tx.toJSON().action;
                await createCustom(hash, handleId, buffer);
                break;
            }
            default:
                throw new Error(`${type} is not an expected transaction type`);
        }

        if (!isPending && isAssetTransaction && success === true) {
            const txInst = await getByHash(tx.hash());
            if (!txInst) {
                throw Exception.InvalidTransaction;
            }
            await handleUTXO(txInst, tx.blockNumber!);
        }
        return txInstance;
    } catch (err) {
        if (err instanceof Sequelize.UniqueConstraintError) {
            const duplicateFields = (err as any).fields;
            if (_.has(duplicateFields, "hash")) {
                throw Exception.AlreadyExist;
            }
        }
        if (err === Exception.InvalidTransaction) {
            throw err;
        }
        console.error(err);
        throw Exception.DBError;
    }
}

export async function updatePendingTransaction(
    hash: H256,
    params: {
        success?: boolean | null;
        errorHint?: string;
        timestamp: number;
        transactionIndex: number;
        blockNumber: number;
        blockHash: H256;
    }
) {
    try {
        await models.Transaction.update(
            {
                blockHash: params.blockHash.value,
                transactionIndex: params.transactionIndex,
                blockNumber: params.blockNumber,
                success: params.success,
                errorHint: params.errorHint,
                timestamp: params.timestamp,
                isPending: false
            },
            {
                where: {
                    hash: hash.value
                }
            }
        );
        const txInst = await getByHash(hash);
        if (txInst!.get().tracker !== null) {
            await handleUTXO(txInst!, params.blockNumber);
        }
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

const includeArray = [
    {
        as: "mintAsset",
        model: models.MintAsset
    },
    {
        as: "transferAsset",
        model: models.TransferAsset,
        include: [
            {
                as: "outputs",
                model: models.AssetTransferOutput,
                include: [
                    {
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                as: "inputs",
                model: models.AssetTransferInput,
                include: [
                    {
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                as: "burns",
                model: models.AssetTransferBurn,
                include: [
                    {
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                as: "orders",
                model: models.OrderOnTransfer
            }
        ]
    },
    {
        as: "composeAsset",
        model: models.ComposeAsset,
        include: [
            {
                as: "inputs",
                model: models.AssetTransferInput
            }
        ]
    },
    {
        as: "decomposeAsset",
        model: models.DecomposeAsset,
        include: [
            {
                as: "input",
                model: models.AssetTransferInput
            },
            {
                as: "outputs",
                model: models.AssetTransferOutput
            }
        ]
    },
    {
        as: "changeAssetScheme",
        model: models.ChangeAssetScheme
    },
    {
        as: "wrapCCC",
        model: models.WrapCCC
    },
    {
        as: "unwrapCCC",
        model: models.UnwrapCCC,
        include: [
            {
                as: "burn",
                model: models.AssetTransferBurn
            }
        ]
    },
    {
        as: "pay",
        model: models.Pay
    },
    {
        as: "setRegularKey",
        model: models.SetRegularKey
    },
    {
        as: "createShard",
        model: models.CreateShard
    },
    {
        as: "store",
        model: models.Store
    },
    {
        as: "remove",
        model: models.Remove
    },
    {
        as: "custom",
        model: models.Custom
    }
];

async function handleUTXO(txInst: TransactionInstance, blockNumber: number) {
    const tx = txInst.get({ plain: true });
    const networkId = tx.networkId;
    const transactionHash = new H256(tx.hash);
    const transactionTracker = new H256(tx.tracker!);
    const txType = tx.type;
    if (txType === "mintAsset") {
        const mintAsset = (await txInst.getMintAsset())!.get();
        const lockScriptHash = new H160(mintAsset.lockScriptHash);
        const parameters = mintAsset.parameters;
        const recipient = getOwner(lockScriptHash, parameters, networkId);
        const assetType = new H160(mintAsset.assetType);
        const shardId = mintAsset.shardId;
        const quantity = new U64(mintAsset.supply);
        const transactionOutputIndex = 0;
        return await createUTXO(
            recipient,
            {
                assetType,
                shardId,
                lockScriptHash,
                parameters,
                quantity,
                transactionHash,
                transactionTracker,
                transactionOutputIndex
            },
            blockNumber
        );
    }
    if (txType === "transferAsset") {
        const transferAsset = (await txInst.getTransferAsset())!;
        const outputs = (await transferAsset.getOutputs())!.map(output =>
            output.get({ plain: true })
        );
        await Promise.all(
            outputs!.map(
                async (
                    output: AssetTransferOutputAttribute,
                    transactionOutputIndex: number
                ) => {
                    const recipient = getOwner(
                        new H160(output.lockScriptHash),
                        output.parameters,
                        networkId
                    );
                    const assetType = new H160(output.assetType);
                    const shardId = output.shardId;
                    const lockScriptHash = new H160(output.lockScriptHash);
                    const parameters = output.parameters;
                    const quantity = new U64(output.quantity);
                    const orderOnTransfer = (await transferAsset.getOrders()).find(
                        o =>
                            o
                                .get({ plain: true })
                                .outputIndices.includes(transactionOutputIndex)
                    );
                    const order =
                        orderOnTransfer && (await orderOnTransfer.getOrder());
                    const orderHash = order && new H256(order.get().orderHash);
                    return createUTXO(
                        recipient,
                        {
                            assetType,
                            shardId,
                            lockScriptHash,
                            parameters,
                            quantity,
                            orderHash,
                            transactionHash,
                            transactionTracker,
                            transactionOutputIndex
                        },
                        blockNumber
                    );
                }
            )
        );
        const inputs = await transferAsset.getInputs();
        if (inputs) {
            await Promise.all(
                inputs.map(async inputInst => {
                    const input = inputInst.get({ plain: true })!;
                    const prevTracker = input.prevOut.tracker;
                    const prevTransaction = await getSuccessfulTransaction(
                        prevTracker
                    );
                    if (!prevTransaction) {
                        throw Exception.InvalidUTXO;
                    }
                    const utxoInst = await getByTxHashIndex(
                        new H256(prevTransaction.get("hash")),
                        input.prevOut.index
                    );
                    if (!utxoInst) {
                        throw Exception.InvalidUTXO;
                    }
                    return await setUsed(
                        utxoInst.get("id"),
                        blockNumber,
                        transactionHash
                    );
                })
            );
        }
        const burns = await transferAsset.getBurns();
        if (burns) {
            await Promise.all(
                burns.map(async burnInst => {
                    const burn = burnInst.get({ plain: true })!;
                    const prevTracker = burn.prevOut.tracker;
                    const prevTransaction = await getSuccessfulTransaction(
                        prevTracker
                    );
                    if (!prevTransaction) {
                        throw Exception.InvalidUTXO;
                    }
                    const utxoInst = await getByTxHashIndex(
                        new H256(prevTransaction.get("hash")),
                        burn.prevOut.index
                    );
                    if (!utxoInst) {
                        throw Exception.InvalidUTXO;
                    }
                    return setUsed(
                        utxoInst.get("id"),
                        blockNumber,
                        transactionHash
                    );
                })
            );
        }
        return;
    }
    if (txType === "composeAsset") {
        const composeAsset = (await txInst.getComposeAsset())!;
        const inputs = (await composeAsset.getInputs())!;
        await Promise.all(
            inputs!.map(async inputInst => {
                const input = inputInst.get({ plain: true });
                const prevTracker = input.prevOut.tracker;
                const prevTransaction = await getSuccessfulTransaction(
                    prevTracker
                );
                if (!prevTransaction) {
                    throw Exception.InvalidUTXO;
                }
                const utxoInst = await getByTxHashIndex(
                    new H256(prevTransaction.get("hash")),
                    input.prevOut.index
                );
                if (!utxoInst) {
                    throw Exception.InvalidUTXO;
                }
                return setUsed(
                    utxoInst.get("id"),
                    blockNumber,
                    transactionHash
                );
            })
        );
        const output = (await composeAsset.get())!;
        const recipient = getOwner(
            new H160(output.lockScriptHash),
            output.parameters,
            networkId
        );
        const assetType = new H160(output.assetType);
        const shardId = output.shardId;
        const lockScriptHash = new H160(output.lockScriptHash);
        const parameters = output.parameters;
        const quantity = new U64(output.supply);
        const transactionOutputIndex = 0;
        return createUTXO(
            recipient,
            {
                assetType,
                shardId,
                lockScriptHash,
                parameters,
                quantity,
                transactionHash,
                transactionTracker,
                transactionOutputIndex
            },
            blockNumber
        );
    }
    if (txType === "decomposeAsset") {
        const decomposeAsset = (await txInst.getDecomposeAsset())!;
        const input = (await decomposeAsset.getInput())!.get({ plain: true });
        const prevTracker = input.prevOut.tracker;
        const prevTransaction = await getSuccessfulTransaction(prevTracker);
        if (!prevTransaction) {
            throw Exception.InvalidUTXO;
        }
        const utxoInst = await getByTxHashIndex(
            new H256(prevTransaction.get("hash")),
            input.prevOut.index
        );
        if (!utxoInst) {
            throw Exception.InvalidUTXO;
        }
        await setUsed(utxoInst.get("id"), blockNumber, transactionHash);

        const outputs = (await decomposeAsset.getOutputs())!;
        return await Promise.all(
            outputs!.map((outputInst, transactionOutputIndex: number) => {
                const output = outputInst.get({ plain: true });
                const recipient = getOwner(
                    new H160(output.lockScriptHash),
                    output.parameters,
                    networkId
                );
                const assetType = new H160(output.assetType);
                const shardId = output.shardId;
                const lockScriptHash = new H160(output.lockScriptHash);
                const parameters = output.parameters;
                const quantity = new U64(output.quantity);
                return createUTXO(
                    recipient,
                    {
                        assetType,
                        shardId,
                        lockScriptHash,
                        parameters,
                        quantity,
                        transactionHash,
                        transactionTracker,
                        transactionOutputIndex
                    },
                    blockNumber
                );
            })
        );
    }
    if (txType === "wrapCCC") {
        const wrapCCC = (await txInst.getWrapCCC())!.get();

        const recipient = getOwner(
            new H160(wrapCCC.lockScriptHash),
            wrapCCC.parameters,
            networkId
        );

        const assetType = H160.zero();
        const shardId = wrapCCC.shardId;
        const lockScriptHash = new H160(wrapCCC.lockScriptHash);
        const parameters = wrapCCC.parameters;
        const quantity = new U64(wrapCCC.quantity);
        const transactionOutputIndex = 0;
        return createUTXO(
            recipient,
            {
                assetType,
                shardId,
                lockScriptHash,
                parameters,
                quantity,
                transactionHash,
                transactionTracker,
                transactionOutputIndex
            },
            blockNumber
        );
    }
    if (txType === "unwrapCCC") {
        const prevOut = (await (await txInst.getUnwrapCCC())!.getBurn())!.get(
            "prevOut"
        );
        const prevTracker = prevOut.tracker;
        const prevTransaction = await getSuccessfulTransaction(prevTracker);

        if (!prevTransaction) {
            throw Exception.InvalidUTXO;
        }
        const utxoInst = await getByTxHashIndex(
            new H256(prevTransaction.get("hash")),
            prevOut.index
        );
        if (!utxoInst) {
            throw Exception.InvalidUTXO;
        }
        await setUsed(utxoInst.get("id"), blockNumber, transactionHash);
    }
}

function getPendingTransactionsQuery(params: {
    address?: string | null;
    assetType?: H160 | null;
}) {
    const { address, assetType } = params;
    const query = [];
    if (address) {
        query.push({
            [Sequelize.Op.or]: [
                { signer: address },
                { "$mintAsset.approver$": address },
                { "$mintAsset.administrator$": address },
                { "$mintAsset.recipient$": address },

                { "$transferAsset.inputs.owner$": address },
                { "$transferAsset.outputs.owner$": address },
                { "$transferAsset.burns.owner$": address },

                { "$composeAsset.approver$": address },
                { "$composeAsset.administrator$": address },
                { "$composeAsset.recipient$": address },
                { "$composeAsset.inputs.owner$": address },

                { "$decomposeAsset.input.owner$": address },
                { "$decomposeAsset.outputs.owner$": address },

                { "$wrapCCC.recipient$": address },
                { "$unwrapCCC.burn.owner$": address },

                { "$pay.receiver$": address }
            ]
        });
    }
    if (assetType) {
        query.push({
            [Sequelize.Op.or]: [
                { "$transferAsset.inputs.assetType$": assetType.value },
                { "$transferAsset.outputs.assetType$": assetType.value },
                { "$transferAsset.burns.assetType$": assetType.value },
                { "$composeAsset.inputs.assetType$": assetType.value },
                { "$decomposeAsset.input.assetType$": assetType.value },
                { "$decomposeAsset.outputs.assetType$": assetType.value },
                { "$unwrapCCC.burn.assetType$": assetType.value }
            ]
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
}) {
    const { address, assetType } = params;
    const query = getPendingTransactionsQuery({ address, assetType });
    try {
        return await models.Transaction.findAll({
            where: {
                [Sequelize.Op.and]: query
            },
            order: [["pendingTimestamp", "DESC"]],
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getNumberOfPendingTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
}) {
    const { address, assetType } = params;
    const query = getPendingTransactionsQuery({ address, assetType });
    try {
        return await models.Transaction.count({
            where: {
                [Sequelize.Op.and]: query
            },
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getByHash(
    hash: H256
): Promise<TransactionInstance | null> {
    try {
        return await models.Transaction.findOne({
            where: {
                hash: hash.value
            },
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

async function getTransactionsQuery(params: {
    address?: string | null;
    assetType?: H160 | null;
    tracker?: H256 | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        tracker,
        onlyConfirmed,
        onlySuccessful,
        confirmThreshold
    } = params;
    const query = [];
    if (address) {
        query.push({
            [Sequelize.Op.or]: [
                { signer: address },
                { "$mintAsset.approver$": address },
                { "$mintAsset.administrator$": address },
                { "$mintAsset.recipient$": address },

                { "$transferAsset.inputs.owner$": address },
                { "$transferAsset.outputs.owner$": address },
                { "$transferAsset.burns.owner$": address },

                { "$composeAsset.approver$": address },
                { "$composeAsset.administrator$": address },
                { "$composeAsset.recipient$": address },
                { "$composeAsset.inputs.owner$": address },

                { "$decomposeAsset.input.owner$": address },
                { "$decomposeAsset.outputs.owner$": address },

                { "$wrapCCC.recipient$": address },
                { "$unwrapCCC.burn.owner$": address },

                { "$pay.receiver$": address }
            ]
        });
    }
    if (assetType) {
        query.push({
            [Sequelize.Op.or]: [
                { "$mintAsset.assetType$": assetType.value },
                { "$transferAsset.inputs.assetType$": assetType.value },
                { "$transferAsset.outputs.assetType$": assetType.value },
                { "$transferAsset.burns.assetType$": assetType.value },
                { "$composeAsset.inputs.assetType$": assetType.value },
                { "$decomposeAsset.input.assetType$": assetType.value },
                { "$decomposeAsset.outputs.assetType$": assetType.value },
                { "$unwrapCCC.burn.assetType$": assetType.value }
            ]
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
    query.push({
        isPending: false
    });
    return query;
}

export async function getTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    tracker?: H256 | null;
    page?: number | null;
    itemsPerPage?: number | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        tracker,
        page = 1,
        itemsPerPage = 15,
        onlyConfirmed = false,
        onlySuccessful = false,
        confirmThreshold = 0
    } = params;
    const query = await getTransactionsQuery({
        address,
        assetType,
        tracker,
        onlyConfirmed,
        onlySuccessful,
        confirmThreshold
    });
    try {
        return await models.Transaction.findAll({
            where: {
                [Sequelize.Op.and]: query
            },
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!,
            subQuery: false,
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getNumberOfTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    tracker?: H256 | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        tracker,
        onlyConfirmed = false,
        onlySuccessful = false,
        confirmThreshold = 0
    } = params;
    const query = await getTransactionsQuery({
        address,
        assetType,
        tracker,
        onlyConfirmed,
        onlySuccessful,
        confirmThreshold
    });
    try {
        return await models.Transaction.count({
            where: {
                [Sequelize.Op.and]: query
            },
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

// @ts-ignore
export async function deleteByHash(hash: H256) {
    try {
        return await models.Transaction.destroy({
            where: { hash: hash.value }
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError;
    }
}

export async function getSuccessfulTransaction(
    tracker: string
): Promise<TransactionInstance | null> {
    try {
        return await models.Transaction.findOne({
            where: {
                tracker,
                success: true
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
