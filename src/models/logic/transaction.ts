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
import models from "../index";
import { TransactionInstance } from "../transaction";

export async function createTransaction(
    actionId: string,
    transaction: Transaction,
    options: {
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
            const transactionJSON = transaction.toJSON().data;
            transactionInstance = await models.Transaction.create({
                type: "assetMint",
                actionId,
                networkId: transaction.networkId,
                shardId: transaction.shardId,
                metadata: transaction.metadata,
                approver: transactionJSON.approver,
                administrator: transactionJSON.administrator,
                hash: transaction.hash().value,
                timestamp: options.timestamp,
                assetName: getAssetName(transaction.metadata),
                parcelHash: options.parcelHash.value,
                parcelIndex: options.parcelIndex,
                blockNumber: options.blockNumber,
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else if (transaction instanceof AssetTransferTransaction) {
            transactionInstance = await models.Transaction.create({
                type: "assetTransfer",
                actionId,
                networkId: transaction.networkId,
                hash: transaction.hash().value,
                timestamp: options.timestamp,
                parcelHash: options.parcelHash.value,
                parcelIndex: options.parcelIndex,
                blockNumber: options.blockNumber,
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else if (transaction instanceof AssetComposeTransaction) {
            transactionInstance = await models.Transaction.create({
                type: "assetCompose",
                actionId,
                networkId: transaction.networkId,
                shardId: transaction.shardId,
                metadata: transaction.metadata,
                hash: transaction.hash().value,
                timestamp: options.timestamp,
                assetName: getAssetName(transaction.metadata),
                parcelHash: options.parcelHash.value,
                parcelIndex: options.parcelIndex,
                blockNumber: options.blockNumber,
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else if (transaction instanceof AssetDecomposeTransaction) {
            transactionInstance = await models.Transaction.create({
                type: "assetDecompose",
                actionId,
                networkId: transaction.networkId,
                hash: transaction.hash().value,
                timestamp: options.timestamp,
                parcelHash: options.parcelHash.value,
                blockNumber: options.blockNumber,
                parcelIndex: options.parcelIndex,
                invoice: options.invoice,
                errorType: options.errorType
            });
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
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
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
