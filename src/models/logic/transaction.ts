import {
    AssetComposeTransaction,
    AssetDecomposeTransaction,
    AssetMintTransaction,
    AssetTransferTransaction,
    H256,
    Transaction
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import models from "../index";
import { TransactionInstance } from "../transaction";
import * as AssetMintOutputModel from "./assetmintoutput";
import * as AssetSchemeModel from "./assetscheme";
import * as AssetTransferBurnModel from "./assettransferburn";
import * as AssetTransferInputModel from "./assettransferInput";
import * as AssetTransferOutputModel from "./assettransferoutput";

export async function createTransaction(
    actionId: string,
    transaction: Transaction,
    params: {
        invoice: boolean | null;
        errorType: string | null;
        blockNumber: number;
        parcelHash: H256;
        parcelIndex: number;
        timestamp: number;
    }
): Promise<TransactionInstance> {
    let transactionInstance: TransactionInstance;
    try {
        if (
            transaction instanceof AssetMintTransaction ||
            transaction instanceof AssetComposeTransaction
        ) {
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
                parcelHash: params.parcelHash.value,
                parcelIndex: params.parcelIndex,
                blockNumber: params.blockNumber,
                invoice: params.invoice,
                errorType: params.errorType
            });
            await AssetMintOutputModel.createAssetMintOutput(
                transaction.hash(),
                transaction.output,
                {
                    assetType: transaction.getAssetSchemeAddress(),
                    approver:
                        transaction.approver && transaction.approver.value,
                    administrator:
                        transaction.administrator &&
                        transaction.administrator.value
                }
            );
            await AssetSchemeModel.createAssetScheme(
                transaction.getAssetSchemeAddress(),
                transaction.hash(),
                transaction.getAssetScheme()
            );
        } else if (transaction instanceof AssetTransferTransaction) {
            transactionInstance = await models.Transaction.create({
                type: "assetTransfer",
                actionId,
                networkId: transaction.networkId,
                hash: transaction.hash().value,
                timestamp: params.timestamp,
                parcelHash: params.parcelHash.value,
                parcelIndex: params.parcelIndex,
                blockNumber: params.blockNumber,
                invoice: params.invoice,
                errorType: params.errorType
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
                transaction.outputs.map(async output => {
                    const assetScheme = await getAssetSheme(output.assetType);
                    await AssetTransferOutputModel.createAssetTransferOutput(
                        transaction.hash(),
                        output,
                        {
                            networkId: transaction.networkId,
                            assetScheme
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
                parcelHash: params.parcelHash.value,
                parcelIndex: params.parcelIndex,
                blockNumber: params.blockNumber,
                invoice: params.invoice,
                errorType: params.errorType
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
                        transaction.administrator.value
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
                parcelHash: params.parcelHash.value,
                blockNumber: params.blockNumber,
                parcelIndex: params.parcelIndex,
                invoice: params.invoice,
                errorType: params.errorType
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
                transaction.outputs.map(async output => {
                    const assetScheme = await getAssetSheme(output.assetType);
                    await AssetTransferOutputModel.createAssetTransferOutput(
                        transaction.hash(),
                        output,
                        {
                            networkId: transaction.networkId,
                            assetScheme
                        }
                    );
                })
            );
        } else {
            throw Exception.InvalidTransaction;
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

// This is for the cascade test
export async function getByHash(
    hash: H256
): Promise<TransactionInstance | null> {
    try {
        return await models.Transaction.findOne({
            where: {
                hash: hash.value
            },
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
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
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
