import {
    Asset,
    AssetComposeTransaction,
    AssetDecomposeTransaction,
    AssetMintTransaction,
    AssetTransferTransaction,
    H160,
    H256,
    Transaction,
    U64
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import models from "../index";
import { TransactionAttribute, TransactionInstance } from "../transaction";
import * as AssetMintOutputModel from "./assetmintoutput";
import * as AssetSchemeModel from "./assetscheme";
import * as AssetTransferBurnModel from "./assettransferburn";
import * as AssetTransferInputModel from "./assettransferinput";
import * as AssetTransferOutputModel from "./assettransferoutput";
import * as BlockModel from "./block";
import * as AddressUtil from "./utils/address";
import * as UTXOModel from "./utxo";

export async function createTransaction(
    actionId: string,
    transaction: Transaction,
    parcelHash: H256,
    isPending: boolean,
    params: {
        invoice?: boolean | null;
        errorType?: string | null;
        blockNumber?: number | null;
        parcelIndex?: number | null;
        timestamp?: number | null;
    }
): Promise<TransactionInstance> {
    let transactionInstance: TransactionInstance;
    try {
        if (transaction instanceof AssetMintTransaction) {
            transactionInstance = await models.Transaction.create({
                type: "assetMint",
                actionId,
                networkId: transaction.networkId,
                shardId: transaction.shardId,
                metadata: transaction.metadata,
                approver: transaction.approver && transaction.approver.value,
                administrator:
                    transaction.administrator &&
                    transaction.administrator.value,
                hash: transaction.hash().value,
                timestamp: params.timestamp,
                assetName: getAssetName(transaction.metadata),
                parcelHash: parcelHash.value,
                parcelIndex: params.parcelIndex,
                blockNumber: params.blockNumber,
                invoice: params.invoice,
                errorType: params.errorType,
                isPending,
                pendingTimestamp: isPending ? +new Date() / 1000 : null
            });
            await AssetSchemeModel.createAssetScheme(
                transaction.getAssetSchemeAddress(),
                transaction.hash(),
                transaction.getAssetScheme()
            );
            await AssetMintOutputModel.createAssetMintOutput(
                transaction.hash(),
                transaction.output,
                {
                    assetType: transaction.getAssetSchemeAddress(),
                    approver:
                        transaction.approver && transaction.approver.value,
                    administrator:
                        transaction.administrator &&
                        transaction.administrator.value,
                    asset: transaction.getMintedAsset(),
                    networkId: transaction.networkId
                }
            );
        } else if (transaction instanceof AssetTransferTransaction) {
            transactionInstance = await models.Transaction.create({
                type: "assetTransfer",
                actionId,
                networkId: transaction.networkId,
                hash: transaction.hash().value,
                timestamp: params.timestamp,
                parcelHash: parcelHash.value,
                parcelIndex: params.parcelIndex,
                blockNumber: params.blockNumber,
                invoice: params.invoice,
                errorType: params.errorType,
                isPending
            });
            await Promise.all(
                transaction.inputs.map(async input => {
                    const assetScheme = await getAssetSheme(
                        input.prevOut.assetType
                    );
                    await AssetTransferInputModel.createAssetTransferInput(
                        transaction.hash(),
                        input,
                        {
                            networkId: transaction.networkId,
                            assetScheme
                        }
                    );
                })
            );
            await Promise.all(
                transaction.outputs.map(async (output, index) => {
                    const assetScheme = await getAssetSheme(output.assetType);
                    await AssetTransferOutputModel.createAssetTransferOutput(
                        transaction.hash(),
                        output,
                        {
                            networkId: transaction.networkId,
                            assetScheme,
                            asset: new Asset({
                                assetType: output.assetType,
                                lockScriptHash: output.lockScriptHash,
                                parameters: output.parameters,
                                amount: output.amount,
                                orderHash: null,
                                transactionHash: transaction.hash(),
                                transactionOutputIndex: index
                            })
                        }
                    );
                })
            );
            await Promise.all(
                transaction.burns.map(async burn => {
                    const assetScheme = await getAssetSheme(
                        burn.prevOut.assetType
                    );
                    await AssetTransferBurnModel.createAssetTransferBurn(
                        transaction.hash(),
                        burn,
                        { networkId: transaction.networkId, assetScheme }
                    );
                })
            );
        } else if (transaction instanceof AssetComposeTransaction) {
            transactionInstance = await models.Transaction.create({
                type: "assetCompose",
                actionId,
                networkId: transaction.networkId,
                shardId: transaction.shardId,
                metadata: transaction.metadata,
                hash: transaction.hash().value,
                timestamp: params.timestamp,
                approver: transaction.approver && transaction.approver.value,
                administrator:
                    transaction.administrator &&
                    transaction.administrator.value,
                assetName: getAssetName(transaction.metadata),
                parcelHash: parcelHash.value,
                parcelIndex: params.parcelIndex,
                blockNumber: params.blockNumber,
                invoice: params.invoice,
                errorType: params.errorType,
                isPending
            });
            await Promise.all(
                transaction.inputs.map(async input => {
                    const assetScheme = await getAssetSheme(
                        input.prevOut.assetType
                    );
                    await AssetTransferInputModel.createAssetTransferInput(
                        transaction.hash(),
                        input,
                        {
                            networkId: transaction.networkId,
                            assetScheme
                        }
                    );
                })
            );
            await AssetMintOutputModel.createAssetMintOutput(
                transaction.hash(),
                transaction.output,
                {
                    assetType: transaction.getAssetSchemeAddress(),
                    approver:
                        transaction.approver && transaction.approver.value,
                    administrator:
                        transaction.administrator &&
                        transaction.administrator.value,
                    networkId: transaction.networkId,
                    asset: transaction.getComposedAsset()
                }
            );
            await AssetSchemeModel.createAssetScheme(
                transaction.getAssetSchemeAddress(),
                transaction.hash(),
                transaction.getAssetScheme()
            );
        } else if (transaction instanceof AssetDecomposeTransaction) {
            transactionInstance = await models.Transaction.create({
                type: "assetDecompose",
                actionId,
                networkId: transaction.networkId,
                hash: transaction.hash().value,
                timestamp: params.timestamp,
                parcelHash: parcelHash.value,
                blockNumber: params.blockNumber,
                parcelIndex: params.parcelIndex,
                invoice: params.invoice,
                errorType: params.errorType,
                isPending
            });
            const inputAssetScheme = await getAssetSheme(
                transaction.input.prevOut.assetType
            );
            await AssetTransferInputModel.createAssetTransferInput(
                transaction.hash(),
                transaction.input,
                {
                    networkId: transaction.networkId,
                    assetScheme: inputAssetScheme
                }
            );
            await Promise.all(
                transaction.outputs.map(async (output, index) => {
                    const assetScheme = await getAssetSheme(output.assetType);
                    await AssetTransferOutputModel.createAssetTransferOutput(
                        transaction.hash(),
                        output,
                        {
                            networkId: transaction.networkId,
                            assetScheme,
                            asset: new Asset({
                                assetType: output.assetType,
                                lockScriptHash: output.lockScriptHash,
                                parameters: output.parameters,
                                amount: output.amount,
                                orderHash: null,
                                transactionHash: transaction.hash(),
                                transactionOutputIndex: index
                            })
                        }
                    );
                })
            );
        } else {
            throw Exception.InvalidTransaction;
        }

        if (!isPending) {
            const txInst = await getByHash(transaction.hash());
            if (!txInst) {
                throw Exception.InvalidTransaction;
            }
            await handleUTXO(txInst.get({ plain: true }), params.blockNumber!);
        }
    } catch (err) {
        console.error(err);
        if (err.code === Exception.InvalidTransaction.code) {
            throw err;
        }
        throw Exception.DBError;
    }
    return transactionInstance;
}

const includeArray = [
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
];

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

async function getTxsQuery(params: {
    address?: string | null;
    assetType?: H256 | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const { address, onlyConfirmed, confirmThreshold, assetType } = params;
    const query = [];
    if (address) {
        query.push({
            [Sequelize.Op.or]: [
                { "$output.recipient$": address },
                { "$inputs.owner$": address },
                { "$outputs.owner$": address },
                { "$input.owner$": address },
                { "$burns.owner$": address }
            ]
        });
    }
    if (assetType) {
        query.push({
            [Sequelize.Op.or]: [
                { "$output.assetType$": assetType.value },
                { "$inputs.assetType$": assetType.value },
                { "$outputs.assetType$": assetType.value },
                { "$input.assetType$": assetType.value },
                { "$burns.assetType$": assetType.value }
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
    const query = await getTxsQuery({
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
            order: [["blockNumber", "DESC"], ["parcelIndex", "DESC"]],
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

export async function getCountOfTransactions(params: {
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
    const query = await getTxsQuery({
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

function getPendingTxsQuery(params: {
    address: string | null;
    assetType: H256 | null;
}) {
    const { address, assetType } = params;
    const query = [];
    if (address) {
        query.push({
            [Sequelize.Op.or]: [
                { "$output.recipient$": address },
                { "$inputs.owner$": address },
                { "$outputs.owner$": address },
                { "$input.owner$": address },
                { "$burns.owner$": address }
            ]
        });
    }
    if (assetType) {
        query.push({
            [Sequelize.Op.or]: [
                { "$output.assetType$": assetType.value },
                { "$inputs.assetType$": assetType.value },
                { "$outputs.assetType$": assetType.value },
                { "$input.assetType$": assetType.value },
                { "$burns.assetType$": assetType.value }
            ]
        });
    }
    query.push({
        isPending: true
    });
    return query;
}

export async function getPendingTransactions(params: {
    address: string | null;
    assetType: H256 | null;
}) {
    const { address, assetType } = params;
    const query = getPendingTxsQuery({ address, assetType });
    try {
        return await models.Transaction.findAll({
            where: {
                [Sequelize.Op.and]: query
            },
            order: [["pendingTimestamp", "DESC"]],
            subQuery: false,
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getCountOfPendingTransactions(params: {
    address: string | null;
    assetType: H256 | null;
}) {
    const { address, assetType } = params;
    const query = getPendingTxsQuery({ address, assetType });
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

export async function updatePendingTransaction(
    hash: H256,
    params: {
        invoice: boolean | null;
        errorType: string | null;
        timestamp: number;
        parcelIndex: number;
        blockNumber: number;
        blockHash: H256;
    }
) {
    try {
        await models.Transaction.update(
            {
                parcelIndex: params.parcelIndex,
                blockNumber: params.blockNumber,
                timestamp: params.timestamp,
                invoice: params.invoice,
                errorType: params.errorType,
                isPending: false
            },
            {
                where: {
                    hash: hash.value
                }
            }
        );
        const txInst = await getByHash(hash);
        if (!txInst) {
            throw Exception.InvalidTransaction;
        }
        await handleUTXO(txInst.get({ plain: true }), params.blockNumber);
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function handleUTXO(
    transaction: TransactionAttribute,
    blockNumber: number
) {
    const networkId = transaction.networkId;
    if (transaction.type === "assetMint") {
        const output = transaction.output;
        if (output) {
            const recipient = AddressUtil.getOwner(
                new H160(output.lockScriptHash),
                output.parameters,
                networkId
            );
            await UTXOModel.createUTXO(
                recipient,
                {
                    assetType: new H256(output.assetType),
                    lockScriptHash: new H160(output.lockScriptHash),
                    parameters: output.parameters,
                    amount: new U64(output.amount),
                    transactionHash: new H256(output.transactionHash),
                    transactionOutputIndex: 0
                },
                blockNumber
            );
        }
    } else if (transaction.type === "assetTransfer") {
        const outputs = transaction.outputs;
        if (outputs) {
            await Promise.all(
                outputs.map(async (output, index) => {
                    const recipient = AddressUtil.getOwner(
                        new H160(output.lockScriptHash),
                        output.parameters,
                        networkId
                    );
                    await UTXOModel.createUTXO(
                        recipient,
                        {
                            assetType: new H256(output.assetType),
                            lockScriptHash: new H160(output.lockScriptHash),
                            parameters: output.parameters,
                            amount: new U64(output.amount),
                            transactionHash: new H256(output.transactionHash),
                            transactionOutputIndex: index
                        },
                        blockNumber
                    );
                })
            );
        }
        const inputs = transaction.inputs;
        if (inputs) {
            await Promise.all(
                inputs.map(async input => {
                    const utxoInst = await UTXOModel.getByTxHashIndex(
                        new H256(input.prevOut.transactionHash),
                        input.prevOut.index
                    );
                    if (!utxoInst) {
                        throw Exception.InvalidUTXO;
                    }
                    await UTXOModel.setUsed(
                        utxoInst.get().id!,
                        new H256(transaction.hash)
                    );
                })
            );
        }
        const burns = transaction.burns;
        if (burns) {
            await Promise.all(
                burns.map(async burn => {
                    const utxoInst = await UTXOModel.getByTxHashIndex(
                        new H256(burn.prevOut.transactionHash),
                        burn.prevOut.index
                    );
                    if (!utxoInst) {
                        throw Exception.InvalidUTXO;
                    }
                    await UTXOModel.setUsed(
                        utxoInst.get().id!,
                        new H256(transaction.hash)
                    );
                })
            );
        }
    } else if (transaction.type === "assetCompose") {
        const output = transaction.output;
        const inputs = transaction.inputs;
        if (inputs) {
            await Promise.all(
                inputs.map(async input => {
                    const utxoInst = await UTXOModel.getByTxHashIndex(
                        new H256(input.prevOut.transactionHash),
                        input.prevOut.index
                    );
                    if (!utxoInst) {
                        throw Exception.InvalidUTXO;
                    }
                    await UTXOModel.setUsed(
                        utxoInst.get().id!,
                        new H256(transaction.hash)
                    );
                })
            );
        }
        if (output) {
            const recipient = AddressUtil.getOwner(
                new H160(output.lockScriptHash),
                output.parameters,
                networkId
            );
            await UTXOModel.createUTXO(
                recipient,
                {
                    assetType: new H256(output.assetType),
                    lockScriptHash: new H160(output.lockScriptHash),
                    parameters: output.parameters,
                    amount: new U64(output.amount),
                    transactionHash: new H256(output.transactionHash),
                    transactionOutputIndex: 0
                },
                blockNumber
            );
        }
    } else if (transaction.type === "assetDecompose") {
        const outputs = transaction.outputs;
        const input = transaction.input;
        if (input) {
            const utxoInst = await UTXOModel.getByTxHashIndex(
                new H256(input.prevOut.transactionHash),
                input.prevOut.index
            );
            if (!utxoInst) {
                throw Exception.InvalidUTXO;
            }
            await UTXOModel.setUsed(
                utxoInst.get().id!,
                new H256(transaction.hash)
            );
        }
        if (outputs) {
            await Promise.all(
                outputs.map(async (output, index) => {
                    const recipient = AddressUtil.getOwner(
                        new H160(output.lockScriptHash),
                        output.parameters,
                        networkId
                    );
                    await UTXOModel.createUTXO(
                        recipient,
                        {
                            assetType: new H256(output.assetType),
                            lockScriptHash: new H160(output.lockScriptHash),
                            parameters: output.parameters,
                            amount: new U64(output.amount),
                            transactionHash: new H256(output.transactionHash),
                            transactionOutputIndex: index
                        },
                        blockNumber
                    );
                })
            );
        }
    } else {
        throw Exception.InvalidTransaction;
    }
}

async function getAssetSheme(assetType: H256): Promise<AssetSchemeAttribute> {
    const assetSchemeInstance = await AssetSchemeModel.getByAssetType(
        assetType
    );
    if (!assetSchemeInstance) {
        throw Exception.InvalidTransaction;
    }
    return assetSchemeInstance.get({
        plain: true
    });
}

function getAssetName(metadata: string): string | null {
    let jsonMeta;
    try {
        jsonMeta = JSON.parse(metadata);
    } catch (e) {
        return null;
    }
    return jsonMeta && jsonMeta.name;
}
