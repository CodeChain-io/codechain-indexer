import {
    ComposeAsset,
    DecomposeAsset,
    H160,
    H256,
    MintAsset,
    SignedTransaction,
    TransferAsset,
    U64
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { AssetTransferOutputAttribute } from "../assettransferoutput";
import models from "../index";
import { TransactionInstance } from "../transaction";
import * as BlockModel from "./block";
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
import { getOwner } from "./utils/address";
import { createUTXO, getByTxHashIndex, setUsed } from "./utxo";

export async function createTransaction(
    tx: SignedTransaction,
    isPending: boolean,
    params?: {
        timestamp?: number | null;
        invoice?: boolean | null;
        errorType?: string | null;
    } | null
): Promise<TransactionInstance> {
    const { timestamp = null, invoice = null, errorType = null } = params || {};
    try {
        const type = tx.unsigned.type();
        const hash = tx.hash().value;
        const txInstance = await models.Transaction.create({
            hash,
            type,
            blockNumber: tx.blockNumber,
            blockHash: tx.blockHash && tx.blockHash.value,
            transactionIndex: tx.transactionIndex,
            seq: tx.unsigned.seq()!,
            fee: tx.unsigned.fee()!.toString(10)!,
            networkId: tx.unsigned.networkId(),
            sig: tx.toJSON().sig,
            signer: tx.getSignerAddress({
                networkId: tx.unsigned.networkId()
            }).value,
            invoice,
            errorType,
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
            case "pay": {
                const { amount, receiver } = tx.toJSON().action;
                await createPay(hash, amount, receiver);
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

        if (!isPending) {
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
        invoice?: boolean | null;
        errorType?: string | null;
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
                invoice: params.invoice,
                errorType: params.errorType,
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
        await handleUTXO(txInst!, params.blockNumber);
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

const includeArray = [
    {
        as: "mintAsset",
        model: models.MintAsset,
        include: [
            {
                as: "output",
                model: models.AssetMintOutput
            }
        ]
    },
    {
        as: "transferAsset",
        model: models.TransferAsset,
        include: [
            {
                as: "outputs",
                model: models.AssetTransferOutput
            },
            {
                as: "inputs",
                model: models.AssetTransferInput
            },
            {
                as: "burns",
                model: models.AssetTransferBurn
            }
        ]
    },
    {
        as: "composeAsset",
        model: models.ComposeAsset,
        include: [
            {
                as: "output",
                model: models.AssetTransferOutput
            },
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
                as: "outputs",
                model: models.AssetTransferOutput
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
    const txType = tx.type;
    if (txType === "mintAsset") {
        const mintAsset = (await txInst.getMintAsset())!;
        const output = (await mintAsset.getOutput())!.get({
            plain: true
        });
        const lockScriptHash = new H160(output.lockScriptHash);
        const parameters = output.parameters;
        const recipient = getOwner(lockScriptHash, parameters, networkId);
        const assetType = new H256(output.assetType);
        const amount = new U64(output.amount);
        const transactionOutputIndex = 0;
        return await createUTXO(
            recipient,
            {
                assetType,
                lockScriptHash,
                parameters,
                amount,
                transactionHash,
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
                (
                    output: AssetTransferOutputAttribute,
                    transactionOutputIndex: number
                ) => {
                    const recipient = getOwner(
                        new H160(output.lockScriptHash),
                        output.parameters,
                        networkId
                    );
                    const assetType = new H256(output.assetType);
                    const lockScriptHash = new H160(output.lockScriptHash);
                    const parameters = output.parameters;
                    const amount = new U64(output.amount);
                    return createUTXO(
                        recipient,
                        {
                            assetType,
                            lockScriptHash,
                            parameters,
                            amount,
                            transactionHash,
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
                    const utxoInst = await getByTxHashIndex(
                        transactionHash,
                        input.prevOut.index
                    );
                    if (!utxoInst) {
                        throw Exception.InvalidUTXO;
                    }
                    return await setUsed(utxoInst.get("id"), transactionHash);
                })
            );
        }
        const burns = await transferAsset.getBurns();
        if (burns) {
            await Promise.all(
                burns.map(async burnInst => {
                    const burn = burnInst.get({ plain: true })!;
                    const utxoInst = await getByTxHashIndex(
                        transactionHash,
                        burn.prevOut.index
                    );
                    if (!utxoInst) {
                        throw Exception.InvalidUTXO;
                    }
                    return setUsed(utxoInst.get("id"), transactionHash);
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
                const utxoInst = await getByTxHashIndex(
                    transactionHash,
                    input.prevOut.index
                );
                if (!utxoInst) {
                    throw Exception.InvalidUTXO;
                }
                return setUsed(utxoInst.get("id"), transactionHash);
            })
        );
        const output = (await composeAsset.getOutput())!.get({ plain: true });
        const recipient = getOwner(
            new H160(output.lockScriptHash),
            output.parameters,
            networkId
        );
        const assetType = new H256(output.assetType);
        const lockScriptHash = new H160(output.lockScriptHash);
        const parameters = output.parameters;
        const amount = new U64(output.amount);
        const transactionOutputIndex = 0;
        return createUTXO(
            recipient,
            {
                assetType,
                lockScriptHash,
                parameters,
                amount,
                transactionHash,
                transactionOutputIndex
            },
            blockNumber
        );
    }
    if (txType === "decomposeAsset") {
        const decomposeAsset = (await txInst.getDecomposeAsset())!;
        const input = (await decomposeAsset.getInput())!.get({ plain: true });
        const utxoInst = await getByTxHashIndex(
            transactionHash,
            input.prevOut.index
        );
        if (!utxoInst) {
            throw Exception.InvalidUTXO;
        }
        await setUsed(utxoInst.get("id"), transactionHash);

        const outputs = (await decomposeAsset.getOutputs())!;
        return await Promise.all(
            outputs!.map((outputInst, transactionOutputIndex: number) => {
                const output = outputInst.get({ plain: true });
                const recipient = getOwner(
                    new H160(output.lockScriptHash),
                    output.parameters,
                    networkId
                );
                const assetType = new H256(output.assetType);
                const lockScriptHash = new H160(output.lockScriptHash);
                const parameters = output.parameters;
                const amount = new U64(output.amount);
                return createUTXO(
                    recipient,
                    {
                        assetType,
                        lockScriptHash,
                        parameters,
                        amount,
                        transactionHash,
                        transactionOutputIndex
                    },
                    blockNumber
                );
            })
        );
    }
}

function getPendingTransactionsQuery(params: {
    address?: string | null;
    assetType?: H256 | null;
}) {
    const { address, assetType } = params;
    const query = [];
    if (address) {
        query.push({
            [Sequelize.Op.or]: [
                { signer: address },
                { "$action.receiver$": address },
                { "$action.output.recipient$": address },
                { "$action.inputs.owner$": address },
                { "$action.outputs.owner$": address },
                { "$action.input.owner$": address },
                { "$action.burns.owner$": address }
            ]
        });
    }
    if (assetType) {
        query.push({
            [Sequelize.Op.or]: [
                { "$action.output.assetType$": assetType.value },
                { "$action.inputs.assetType$": assetType.value },
                { "$action.outputs.assetType$": assetType.value },
                { "$action.input.assetType$": assetType.value },
                { "$action.burns.assetType$": assetType.value }
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
    assetType?: H256 | null;
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
    assetType?: H256 | null;
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
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

async function getTransactionsQuery(params: {
    address?: string | null;
    assetType?: H256 | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const { address, assetType, onlyConfirmed, confirmThreshold } = params;
    const query = [];
    if (address) {
        query.push({
            [Sequelize.Op.or]: [
                { signer: address },
                { "$action.receiver$": address },
                { "$action.output.recipient$": address },
                { "$action.inputs.owner$": address },
                { "$action.outputs.owner$": address },
                { "$action.input.owner$": address },
                { "$action.burns.owner$": address }
            ]
        });
    }
    if (assetType) {
        query.push({
            [Sequelize.Op.or]: [
                { "$action.output.assetType$": assetType.value },
                { "$action.inputs.assetType$": assetType.value },
                { "$action.outputs.assetType$": assetType.value },
                { "$action.input.assetType$": assetType.value },
                { "$action.burns.assetType$": assetType.value }
            ]
        });
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
    query.push({
        isPending: false
    });
    return query;
}

export async function getTransactions(params: {
    address?: string | null;
    assetType?: H256 | null;
    page?: number | null;
    itemsPerPage?: number | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        page = 1,
        itemsPerPage = 15,
        onlyConfirmed = false,
        confirmThreshold = 0
    } = params;
    const query = await getTransactionsQuery({
        address,
        assetType,
        onlyConfirmed,
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
    assetType?: H256 | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        onlyConfirmed = false,
        confirmThreshold = 0
    } = params;
    const query = await getTransactionsQuery({
        address,
        assetType,
        onlyConfirmed,
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
