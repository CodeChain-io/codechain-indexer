import {
    AssetComposeTransaction,
    AssetDecomposeTransaction,
    AssetMintTransaction,
    AssetTransferAddress,
    AssetTransferInput,
    AssetTransferOutput,
    AssetTransferTransaction,
    H160,
    H256,
    Transaction
} from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import models from "../index";
import {
    AssetMintOutputAttribute,
    AssetTransferInputAttribute,
    AssetTransferOutputAttribute,
    TransactionInstance
} from "../transaction";
import * as AssetSchemeModel from "./assetscheme";

const P2PKH = "5f5960a7bca6ceeeb0c97bc717562914e7a1de04";
const P2PKHBURN = "37572bdcc22d39a59c0d12d301f6271ba3fdd451";

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
            transactionInstance = await models.Transaction.create({
                type: "assetMint",
                actionId,
                output: getAssetMintOutputAttribute(
                    transaction.output,
                    transaction.getAssetSchemeAddress(),
                    {
                        approver:
                            transaction.approver && transaction.approver.value,
                        administrator:
                            transaction.administrator &&
                            transaction.administrator.value
                    }
                ),
                networkId: transaction.networkId,
                shardId: transaction.shardId,
                metadata: transaction.metadata,
                approver: transaction.approver && transaction.approver.value,
                administrator:
                    transaction.administrator &&
                    transaction.administrator.value,
                hash: transaction.hash().value,
                timestamp: options.timestamp,
                assetName: getAssetName(transaction.metadata),
                parcelHash: options.parcelHash.value,
                parcelIndex: options.parcelIndex,
                blockNumber: options.blockNumber,
                invoice: options.invoice,
                errorType: options.errorType
            });
            await AssetSchemeModel.createAssetScheme(
                transaction.getAssetSchemeAddress(),
                transaction.hash(),
                transaction.getAssetScheme()
            );
        } else if (transaction instanceof AssetTransferTransaction) {
            const inputs = await Promise.all(
                transaction.inputs.map(async input => {
                    const assetScheme = await getAssetSheme(
                        input.prevOut.assetType
                    );
                    return getAssetTransferInputAttribute(
                        input,
                        transaction.networkId,
                        assetScheme
                    );
                })
            );
            const outputs = await Promise.all(
                transaction.outputs.map(async output => {
                    const assetScheme = await getAssetSheme(output.assetType);
                    return getAssetTransferOutputAttribute(
                        output,
                        transaction.networkId,
                        assetScheme
                    );
                })
            );
            const burns = await Promise.all(
                transaction.burns.map(async burn => {
                    const assetScheme = await getAssetSheme(
                        burn.prevOut.assetType
                    );
                    return getAssetTransferInputAttribute(
                        burn,
                        transaction.networkId,
                        assetScheme
                    );
                })
            );
            transactionInstance = await models.Transaction.create({
                type: "assetTransfer",
                actionId,
                inputs,
                outputs,
                burns,
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
            const inputs = await Promise.all(
                transaction.inputs.map(async input => {
                    const assetScheme = await getAssetSheme(
                        input.prevOut.assetType
                    );
                    return getAssetTransferInputAttribute(
                        input,
                        transaction.networkId,
                        assetScheme
                    );
                })
            );
            transactionInstance = await models.Transaction.create({
                type: "assetCompose",
                actionId,
                inputs,
                output: getAssetMintOutputAttribute(
                    transaction.output,
                    transaction.getAssetSchemeAddress(),
                    {
                        approver:
                            transaction.approver && transaction.approver.value,
                        administrator:
                            transaction.administrator &&
                            transaction.administrator.value
                    }
                ),
                networkId: transaction.networkId,
                shardId: transaction.shardId,
                metadata: transaction.metadata,
                hash: transaction.hash().value,
                timestamp: options.timestamp,
                approver: transaction.approver && transaction.approver.value,
                administrator:
                    transaction.administrator &&
                    transaction.administrator.value,
                assetName: getAssetName(transaction.metadata),
                parcelHash: options.parcelHash.value,
                parcelIndex: options.parcelIndex,
                blockNumber: options.blockNumber,
                invoice: options.invoice,
                errorType: options.errorType
            });
            await AssetSchemeModel.createAssetScheme(
                transaction.getAssetSchemeAddress(),
                transaction.hash(),
                transaction.getAssetScheme()
            );
        } else if (transaction instanceof AssetDecomposeTransaction) {
            const inputAssetScheme = await getAssetSheme(
                transaction.input.prevOut.assetType
            );
            const input = getAssetTransferInputAttribute(
                transaction.input,
                transaction.networkId,
                inputAssetScheme
            );
            const outputs = await Promise.all(
                transaction.outputs.map(async output => {
                    const assetScheme = await getAssetSheme(output.assetType);
                    return getAssetTransferOutputAttribute(
                        output,
                        transaction.networkId,
                        assetScheme
                    );
                })
            );
            transactionInstance = await models.Transaction.create({
                type: "assetDecompose",
                actionId,
                networkId: transaction.networkId,
                input,
                outputs,
                hash: transaction.hash().value,
                timestamp: options.timestamp,
                parcelHash: options.parcelHash.value,
                blockNumber: options.blockNumber,
                parcelIndex: options.parcelIndex,
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else {
            console.log(transaction.toJSON());
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

function getAssetTransferInputAttribute(
    input: AssetTransferInput,
    networkId: string,
    assetScheme: AssetSchemeAttribute
): AssetTransferInputAttribute {
    return {
        timelock: input.timelock,
        lockScript: input.lockScript,
        unlockScript: input.unlockScript,
        prevOut: {
            transactionHash: input.prevOut.transactionHash.value,
            index: input.prevOut.index,
            assetType: input.prevOut.assetType.value,
            assetScheme,
            amount: input.prevOut.amount.value.toString(10),
            owner:
                input.prevOut.lockScriptHash &&
                input.prevOut.parameters &&
                getOwner(
                    input.prevOut.lockScriptHash,
                    input.prevOut.parameters,
                    networkId
                ),
            lockScriptHash:
                input.prevOut.lockScriptHash &&
                input.prevOut.lockScriptHash.value,
            parameters: input.prevOut.parameters
        }
    };
}

function getAssetTransferOutputAttribute(
    output: AssetTransferOutput,
    networkId: string,
    assetScheme: AssetSchemeAttribute
): AssetTransferOutputAttribute {
    return {
        lockScriptHash: output.lockScriptHash.value,
        parameters: output.parameters,
        assetType: output.assetType.value,
        amount: output.amount.value.toString(10),
        assetScheme,
        owner: getOwner(output.lockScriptHash, output.parameters, networkId)
    };
}

function getAssetMintOutputAttribute(
    output: AssetMintOutput,
    assetType: H256,
    options: {
        approver?: string | null;
        administrator?: string | null;
    }
): AssetMintOutputAttribute {
    return {
        lockScriptHash: output.lockScriptHash.value,
        parameters: output.parameters,
        amount: output.amount!.value.toString(10),
        assetType: assetType.value,
        approver: options.approver,
        administrator: options.administrator
    };
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

function getOwner(
    lockScriptHash: H160,
    parameters: Buffer[],
    networkId: string
) {
    let owner = "";
    if (lockScriptHash.value === P2PKH) {
        owner = AssetTransferAddress.fromTypeAndPayload(
            1,
            new H160(Buffer.from(parameters[0]).toString("hex")),
            {
                networkId
            }
        ).value;
    } else if (lockScriptHash.value === P2PKHBURN) {
        owner = AssetTransferAddress.fromTypeAndPayload(
            2,
            new H160(Buffer.from(parameters[0]).toString("hex")),
            {
                networkId
            }
        ).value;
    } else if (parameters.length === 0) {
        owner = AssetTransferAddress.fromTypeAndPayload(0, lockScriptHash, {
            networkId
        }).value;
    }
    return owner;
}
