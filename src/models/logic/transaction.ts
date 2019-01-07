import {
    H160,
    H256,
    SignedTransaction,
    U64
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { ActionInstance } from "../action";
import { AssetTransferInputAttribute } from "../assettransferinput";
import { AssetTransferOutputAttribute } from "../assettransferoutput";
import models from "../index";
import { TransactionInstance } from "../transaction";
import * as ActionModel from "./action";
import * as BlockModel from "./block";
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
        const actionId = (await ActionModel.createAction(tx.unsigned)).get({
            plain: true
        }).id;
        const txInstance = await models.Transaction.create({
            hash: tx.hash().value,
            actionId,
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
        as: "action",
        model: models.Action,
        include: [
            {
                as: "outputs",
                model: models.AssetTransferOutput
            },
            {
                as: "output",
                model: models.AssetMintOutput
            },
            {
                as: "inputs",
                model: models.AssetTransferInput
            },
            {
                as: "input",
                model: models.AssetDecomposeInput
            }
        ]
    }
];

async function handleUTXO(txInst: TransactionInstance, blockNumber: number) {
    const tx = txInst.get({ plain: true });
    const actionInst: ActionInstance = (await txInst.getAction())!;
    const action = actionInst.get({ plain: true });
    const networkId = tx.networkId;
    const transactionHash = new H256(tx.hash);
    const actionType = action.type;
    if (actionType === "mintAsset") {
        const output = (await (actionInst as any).getOutput()).get({
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
    if (actionType === "transferAsset") {
        const outputs = await (actionInst as any).getOutputs();
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
        const inputs = await (actionInst as any).getInputs();
        if (inputs) {
            await Promise.all(
                inputs.map(async (input: AssetTransferInputAttribute) => {
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
        const burns = await (actionInst as any).getBurns();
        if (burns) {
            await Promise.all(
                burns.map(async (burn: AssetTransferInputAttribute) => {
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
    if (actionType === "composeAsset") {
        const inputs = (await (actionInst as any).getInputs()).get({
            plain: true
        });
        await Promise.all(
            inputs!.map(async (input: AssetTransferInputAttribute) => {
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
        const output = (await (actionInst as any).getOutput()).get({
            plain: true
        });
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
    if (actionType === "decomposeAsset") {
        const input = (await (actionInst as any).getInput()).get({
            plain: true
        });
        const utxoInst = await getByTxHashIndex(
            transactionHash,
            input.prevOut.index
        );
        if (!utxoInst) {
            throw Exception.InvalidUTXO;
        }
        await setUsed(utxoInst.get("id"), transactionHash);

        const outputs = (await (actionInst as any).getOutputs()).get({
            plain: true
        });
        return await Promise.all(
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
    }
}

function getPendingTransactionsQuery(params: { address?: string | null }) {
    const { address } = params;
    const query = [];
    if (address) {
        query.push({
            [Sequelize.Op.or]: [
                { signer: address },
                { "$action.receiver$": address }
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
}) {
    const { address } = params;
    const query = getPendingTransactionsQuery({ address });
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
}) {
    const { address } = params;
    const query = getPendingTransactionsQuery({ address });
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
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const { address, onlyConfirmed, confirmThreshold } = params;
    const query = [];
    if (address) {
        query.push({
            [Sequelize.Op.or]: [
                { signer: address },
                { "$action.receiver$": address }
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
    page?: number | null;
    itemsPerPage?: number | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        page = 1,
        itemsPerPage = 15,
        onlyConfirmed = false,
        confirmThreshold = 0
    } = params;
    const query = await getTransactionsQuery({
        address,
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
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const { address, onlyConfirmed = false, confirmThreshold = 0 } = params;
    const query = await getTransactionsQuery({
        address,
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
