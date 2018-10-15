import { BigNumber } from "bignumber.js";
import { Buffer } from "buffer";

import {
    ActionDoc,
    AssetSchemeDoc,
    AssetTransferInputDoc,
    AssetTransferOutputDoc,
    BlockDoc,
    ParcelDoc,
    PendingParcelDoc,
    TransactionDoc
} from "codechain-indexer-types/lib/types";
import { Type } from "codechain-indexer-types/lib/utils";
import { SDK } from "codechain-sdk";
import {
    Action,
    AssetMintTransaction,
    AssetScheme,
    AssetTransactionGroup,
    AssetTransferAddress,
    AssetTransferInput,
    AssetTransferOutput,
    AssetTransferTransaction,
    Block,
    CreateShard,
    H160,
    H256,
    Invoice,
    Payment,
    PlatformAddress,
    SetRegularKey,
    SignedParcel,
    Transaction,
    U256
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";

export class TypeConverter {
    private P2PKH = "5f5960a7bca6ceeeb0c97bc717562914e7a1de04";
    private P2PKHBURN = "37572bdcc22d39a59c0d12d301f6271ba3fdd451";
    private sdk: SDK;
    private networkId: string;

    public constructor(codechainHost: string, networkId: string = "tc") {
        this.sdk = new SDK({ server: codechainHost, options: { networkId } });
        this.networkId = networkId;
    }

    public fromAssetTransferInput = async (assetTransferInput: AssetTransferInput): Promise<AssetTransferInputDoc> => {
        const assetScheme = await this.getAssetScheme(assetTransferInput.prevOut.assetType);
        let transaction;
        try {
            transaction = await this.sdk.rpc.chain.getTransaction(assetTransferInput.prevOut.transactionHash);
        } catch (e) {
            // nothing
        }
        if (!transaction) {
            const pendingParcels = await this.sdk.rpc.chain.getPendingParcels();
            const pendingTransactions = _.chain(pendingParcels)
                .filter(parcel => parcel.unsigned.action instanceof AssetTransactionGroup)
                .flatMap(parcel => (parcel.unsigned.action as AssetTransactionGroup).transactions)
                .value();
            transaction = _.find(
                pendingTransactions,
                tx => (tx as Transaction).hash().value === assetTransferInput.prevOut.transactionHash.value
            );
        }

        let owner = "";
        let lockScriptHash = "";
        let parameters: Buffer[] = [];
        if (transaction instanceof AssetMintTransaction) {
            owner = this.getOwner(transaction.output.lockScriptHash, transaction.output.parameters);
            lockScriptHash = transaction.output.lockScriptHash.value;
            parameters = transaction.output.parameters;
        } else if (transaction instanceof AssetTransferTransaction) {
            owner = this.getOwner(
                transaction.outputs[assetTransferInput.prevOut.index].lockScriptHash,
                transaction.outputs[assetTransferInput.prevOut.index].parameters
            );
            lockScriptHash = transaction.outputs[assetTransferInput.prevOut.index].lockScriptHash.value;
            parameters = transaction.outputs[assetTransferInput.prevOut.index].parameters;
        }
        return {
            prevOut: {
                transactionHash: assetTransferInput.prevOut.transactionHash.value,
                index: assetTransferInput.prevOut.index,
                assetType: assetTransferInput.prevOut.assetType.value,
                assetScheme,
                amount: assetTransferInput.prevOut.amount,
                owner,
                lockScriptHash,
                parameters
            },
            lockScript: Buffer.from(assetTransferInput.lockScript),
            unlockScript: Buffer.from(assetTransferInput.unlockScript)
        };
    };

    public fromAssetTransferOutput = async (
        assetTransferOutput: AssetTransferOutput
    ): Promise<AssetTransferOutputDoc> => {
        const assetScheme = await this.getAssetScheme(assetTransferOutput.assetType);
        return {
            lockScriptHash: assetTransferOutput.lockScriptHash.value,
            owner: this.getOwner(assetTransferOutput.lockScriptHash, assetTransferOutput.parameters),
            parameters: _.map(assetTransferOutput.parameters, p => Buffer.from(p)),
            assetType: assetTransferOutput.assetType.value,
            assetScheme,
            amount: assetTransferOutput.amount
        };
    };

    public fromTransaction = async (
        transaction: Transaction,
        timestamp: number,
        parcel: SignedParcel,
        transactionIndex: number
    ): Promise<TransactionDoc> => {
        const parcelInvoice = await this.sdk.rpc.chain.getParcelInvoice(parcel.hash());
        const transactionInvoice = parcelInvoice ? (parcelInvoice as Invoice[])[transactionIndex] : undefined;
        if (transaction instanceof AssetMintTransaction) {
            const metadata = Type.getMetadata(transaction.metadata);
            return {
                type: transaction.type,
                data: {
                    output: {
                        lockScriptHash: transaction.output.lockScriptHash.value,
                        parameters: _.map(transaction.output.parameters, p => Buffer.from(p)),
                        amount: transaction.output.amount,
                        assetType: transaction.getAssetSchemeAddress().value,
                        owner: this.getOwner(transaction.output.lockScriptHash, transaction.output.parameters)
                    },
                    networkId: transaction.networkId,
                    metadata: transaction.metadata,
                    registrar: transaction.registrar ? transaction.registrar.value : "",
                    nonce: transaction.nonce,
                    hash: transaction.hash().value,
                    timestamp,
                    assetName: metadata.name || "",
                    parcelHash: parcel ? parcel.hash().value : "",
                    blockNumber: parcel ? parcel.blockNumber || 0 : 0,
                    parcelIndex: parcel ? parcel.parcelIndex || 0 : 0,
                    transactionIndex,
                    invoice: transactionInvoice ? transactionInvoice.success : undefined,
                    errorType: transactionInvoice
                        ? transactionInvoice.error
                            ? transactionInvoice.error.type
                            : ""
                        : undefined
                },
                isRetracted: false
            };
        } else if (transaction instanceof AssetTransferTransaction) {
            const transactionJson = transaction.toJSON();
            const burns = await Promise.all(_.map(transaction.burns, burn => this.fromAssetTransferInput(burn)));
            const inputs = await Promise.all(_.map(transaction.inputs, input => this.fromAssetTransferInput(input)));
            const outputs = await Promise.all(
                _.map(transaction.outputs, output => this.fromAssetTransferOutput(output))
            );
            return {
                type: transactionJson.type,
                data: {
                    networkId: transactionJson.data.networkId,
                    burns,
                    inputs,
                    outputs,
                    nonce: transactionJson.data.nonce,
                    hash: transaction.hash().value,
                    timestamp,
                    parcelHash: parcel ? parcel.hash().value : "",
                    blockNumber: parcel ? parcel.blockNumber || 0 : 0,
                    parcelIndex: parcel ? parcel.parcelIndex || 0 : 0,
                    transactionIndex,
                    invoice: transactionInvoice ? transactionInvoice.success : undefined,
                    errorType: transactionInvoice
                        ? transactionInvoice.error
                            ? transactionInvoice.error.type
                            : ""
                        : undefined
                },
                isRetracted: false
            };
        }
        throw new Error("Unexpected transaction");
    };

    public fromAction = async (action: Action, timestamp: number, parcel: SignedParcel): Promise<ActionDoc> => {
        if (action instanceof AssetTransactionGroup) {
            const actionJson = action.toJSON();
            const transactionDocs = await Promise.all(
                _.map(action.transactions, (transaction, i) => this.fromTransaction(transaction, timestamp, parcel, i))
            );
            return {
                action: actionJson.action,
                transactions: transactionDocs
            };
        } else if (action instanceof SetRegularKey) {
            const parcelInvoice = (await this.sdk.rpc.chain.getParcelInvoice(parcel.hash())) as Invoice;
            const actionJson = action.toJSON();
            return {
                action: actionJson.action,
                key: actionJson.key,
                invoice: parcelInvoice ? parcelInvoice.success : undefined,
                errorType: parcelInvoice ? (parcelInvoice.error ? parcelInvoice.error.type : "") : undefined
            };
        } else if (action instanceof Payment) {
            const actionJson = action.toJSON();
            const parcelInvoice = (await this.sdk.rpc.chain.getParcelInvoice(parcel.hash())) as Invoice;
            return {
                action: actionJson.action,
                receiver: actionJson.receiver,
                amount: actionJson.amount,
                invoice: parcelInvoice ? parcelInvoice.success : undefined,
                errorType: parcelInvoice ? (parcelInvoice.error ? parcelInvoice.error.type : "") : undefined
            };
        } else if (action instanceof CreateShard) {
            const actionJson = action.toJSON();
            const parcelInvoice = (await this.sdk.rpc.chain.getParcelInvoice(parcel.hash())) as Invoice;
            return {
                action: actionJson.action,
                invoice: parcelInvoice ? parcelInvoice.success : undefined,
                errorType: parcelInvoice ? (parcelInvoice.error ? parcelInvoice.error.type : "") : undefined
            };
        }
        throw new Error("Unexpected action");
    };

    public fromParcel = async (parcel: SignedParcel, timestamp: number): Promise<ParcelDoc> => {
        const action = await this.fromAction(parcel.unsigned.action, timestamp, parcel);
        let owner = await this.sdk.rpc.chain.getRegularKeyOwner(parcel.getSignerPublic());
        if (!owner) {
            owner = PlatformAddress.fromPublic(parcel.getSignerPublic(), {
                networkId: this.networkId
            });
        }

        return {
            blockNumber: parcel.blockNumber,
            blockHash: parcel.hash().value,
            parcelIndex: parcel.parcelIndex,
            nonce: parcel.unsigned.nonce ? parcel.unsigned.nonce.value.toString(10) : "0",
            fee: parcel.unsigned.fee ? parcel.unsigned.fee.value.toString(10) : "0",
            networkId: parcel.unsigned.networkId,
            signer: owner.value,
            sig: parcel.toJSON().sig,
            hash: parcel.hash().value,
            action,
            timestamp,
            countOfTransaction:
                parcel.unsigned.action instanceof AssetTransactionGroup
                    ? parcel.unsigned.action.transactions.length
                    : 0,
            isRetracted: false
        };
    };

    public fromBlock = async (block: Block, defaultMiningReward: number): Promise<BlockDoc> => {
        const parcelDocs = await Promise.all(_.map(block.parcels, parcel => this.fromParcel(parcel, block.timestamp)));
        const chainMiningReward = block.number === 0 ? 0 : defaultMiningReward;
        const miningReward = _.reduce(
            block.parcels,
            (memo, parcel) => new BigNumber((parcel.unsigned.fee as U256).value.toString(10)).plus(memo),
            new BigNumber(0)
        )
            .plus(chainMiningReward)
            .toString(10);
        return {
            parentHash: block.parentHash.value,
            timestamp: block.timestamp,
            number: block.number,
            author: block.author.value,
            extraData: Buffer.from(block.extraData),
            parcelsRoot: block.parcelsRoot.value,
            stateRoot: block.stateRoot.value,
            invoicesRoot: block.invoicesRoot.value,
            score: block.score.value.toString(10),
            seal: _.map(block.seal, s => Buffer.from(s)),
            hash: block.hash.value,
            parcels: parcelDocs,
            isRetracted: false,
            miningReward
        };
    };

    public fromPendingParcel = async (parcel: SignedParcel): Promise<PendingParcelDoc> => {
        const parcelDoc = await this.fromParcel(parcel, 0);
        return {
            parcel: parcelDoc,
            status: "pending",
            timestamp: Math.floor(Date.now() / 1000)
        };
    };

    private fromAssetScheme = (assetScheme: AssetScheme): AssetSchemeDoc => {
        return {
            metadata: assetScheme.metadata,
            registrar: assetScheme.registrar ? assetScheme.registrar.value : "",
            amount: assetScheme.amount,
            networkId: assetScheme.networkId
        };
    };

    private getOwner = (lockScriptHash: H160, parameters: any) => {
        let owner = "";
        if (lockScriptHash.value === this.P2PKH) {
            owner = AssetTransferAddress.fromTypeAndPayload(1, new H160(Buffer.from(parameters[0]).toString("hex")), {
                networkId: this.networkId
            }).value;
        } else if (lockScriptHash.value === this.P2PKHBURN) {
            owner = AssetTransferAddress.fromTypeAndPayload(2, new H160(Buffer.from(parameters[0]).toString("hex")), {
                networkId: this.networkId
            }).value;
        } else if (parameters.length === 0) {
            owner = AssetTransferAddress.fromTypeAndPayload(0, lockScriptHash, {
                networkId: this.networkId
            }).value;
        }
        return owner;
    };

    private getAssetScheme = async (assetType: H256): Promise<AssetSchemeDoc> => {
        const assetScheme = await this.sdk.rpc.chain.getAssetSchemeByType(assetType);
        if (assetScheme) {
            return this.fromAssetScheme(assetScheme);
        }
        const pendingParcels = await this.sdk.rpc.chain.getPendingParcels();
        const pendingMintTransactions = _.chain(pendingParcels)
            .filter(parcel => parcel.unsigned.action instanceof AssetTransactionGroup)
            .flatMap(parcel => (parcel.unsigned.action as AssetTransactionGroup).transactions)
            .filter(transaction => transaction instanceof AssetMintTransaction)
            .map(tx => tx as AssetMintTransaction)
            .value();
        const mintTransaction = _.find(
            pendingMintTransactions,
            (tx: AssetMintTransaction) => tx.getAssetSchemeAddress().value === assetType.value
        );
        if (mintTransaction) {
            return this.fromAssetScheme(mintTransaction.getAssetScheme());
        }
        throw new Error("Invalid asset type");
    };
}
