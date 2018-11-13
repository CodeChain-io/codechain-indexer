import { BigNumber } from "bignumber.js";
import { Buffer } from "buffer";

import {
    ActionDoc,
    AssetComposeTransactionDoc,
    AssetDecomposeTransactionDoc,
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
    AssetComposeTransaction,
    AssetDecomposeTransaction,
    AssetMintTransaction,
    AssetScheme,
    AssetTransaction,
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
    SetShardOwners,
    SetShardUsers,
    SignedParcel,
    Transaction,
    U256
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import { ElasticSearchAgent } from "..";

export class TypeConverter {
    private P2PKH = "5f5960a7bca6ceeeb0c97bc717562914e7a1de04";
    private P2PKHBURN = "37572bdcc22d39a59c0d12d301f6271ba3fdd451";
    private sdk: SDK;
    private db: ElasticSearchAgent;
    private networkId: string;

    public constructor(codechainHost: string, elasticsearchHost: string, networkId: string = "tc") {
        this.sdk = new SDK({ server: codechainHost, options: { networkId } });
        this.db = new ElasticSearchAgent(elasticsearchHost);
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
                .filter(parcel => parcel.unsigned.action instanceof AssetTransaction)
                .map(parcel => (parcel.unsigned.action as AssetTransaction).transaction)
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
                amount: assetTransferInput.prevOut.amount.toString(10),
                owner,
                lockScriptHash,
                parameters
            },
            timelock: assetTransferInput.timelock,
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
            amount: assetTransferOutput.amount.toString(10)
        };
    };

    public fromTransaction = async (
        transaction: Transaction,
        timestamp: number,
        parcel: SignedParcel
    ): Promise<TransactionDoc> => {
        const parcelInvoice = await this.sdk.rpc.chain.getParcelInvoice(parcel.hash());
        if (transaction instanceof AssetMintTransaction) {
            const metadata = Type.getMetadata(transaction.metadata);
            return {
                type: "assetMint",
                data: {
                    output: {
                        lockScriptHash: transaction.output.lockScriptHash.value,
                        parameters: _.map(transaction.output.parameters, p => Buffer.from(p)),
                        amount: transaction.output.amount && transaction.output.amount.toString(10),
                        assetType: transaction.getAssetSchemeAddress().value,
                        recipient: this.getOwner(transaction.output.lockScriptHash, transaction.output.parameters)
                    },
                    networkId: transaction.networkId,
                    shardId: transaction.shardId,
                    metadata: transaction.metadata,
                    registrar: transaction.registrar && transaction.registrar.value,
                    hash: transaction.hash().value,
                    timestamp,
                    assetName: metadata.name || "",
                    parcelHash: parcel && parcel.hash().value,
                    blockNumber: (parcel && parcel.blockNumber) || 0,
                    parcelIndex: (parcel && parcel.parcelIndex) || 0,
                    invoice: parcelInvoice && parcelInvoice.success,
                    errorType: parcelInvoice && parcelInvoice.error && parcelInvoice.error.type
                },
                isRetracted: false
            };
        } else if (transaction instanceof AssetTransferTransaction) {
            const burns = await Promise.all(_.map(transaction.burns, burn => this.fromAssetTransferInput(burn)));
            const inputs = await Promise.all(_.map(transaction.inputs, input => this.fromAssetTransferInput(input)));
            const outputs = await Promise.all(
                _.map(transaction.outputs, output => this.fromAssetTransferOutput(output))
            );
            return {
                type: "assetTransfer",
                data: {
                    networkId: transaction.networkId,
                    burns,
                    inputs,
                    outputs,
                    hash: transaction.hash().value,
                    timestamp,
                    parcelHash: parcel && parcel.hash().value,
                    blockNumber: (parcel && parcel.blockNumber) || 0,
                    parcelIndex: (parcel && parcel.parcelIndex) || 0,
                    invoice: parcelInvoice && parcelInvoice.success,
                    errorType: parcelInvoice && parcelInvoice.error && parcelInvoice.error.type
                },
                isRetracted: false
            };
        } else if (transaction instanceof AssetComposeTransaction) {
            const inputs = await Promise.all(_.map(transaction.inputs, input => this.fromAssetTransferInput(input)));
            return {
                type: "assetCompose",
                data: {
                    networkId: transaction.networkId,
                    shardId: transaction.shardId,
                    metadata: transaction.metadata,
                    registrar: transaction.registrar,
                    output: {
                        lockScriptHash: transaction.output.lockScriptHash.value,
                        parameters: _.map(transaction.output.parameters, p => Buffer.from(p)),
                        amount: transaction.output.amount && transaction.output.amount.toString(10),
                        assetType: transaction.getAssetSchemeAddress().value,
                        recipient: this.getOwner(transaction.output.lockScriptHash, transaction.output.parameters)
                    },
                    inputs,
                    hash: transaction.hash().value,
                    timestamp,
                    parcelHash: parcel && parcel.hash().value,
                    blockNumber: (parcel && parcel.blockNumber) || 0,
                    parcelIndex: (parcel && parcel.parcelIndex) || 0,
                    invoice: parcelInvoice && parcelInvoice.success,
                    errorType: parcelInvoice && parcelInvoice.error && parcelInvoice.error.type
                },
                isRetracted: false
            } as AssetComposeTransactionDoc;
        } else if (transaction instanceof AssetDecomposeTransaction) {
            const outputs = await Promise.all(
                _.map(transaction.outputs, output => this.fromAssetTransferOutput(output))
            );
            return {
                type: "assetDecompose",
                data: {
                    input: await this.fromAssetTransferInput(transaction.input),
                    outputs,
                    networkId: transaction.networkId,
                    hash: transaction.hash().value,
                    timestamp,
                    parcelHash: parcel && parcel.hash().value,
                    blockNumber: (parcel && parcel.blockNumber) || 0,
                    parcelIndex: (parcel && parcel.parcelIndex) || 0,
                    invoice: parcelInvoice && parcelInvoice.success,
                    errorType: parcelInvoice && parcelInvoice.error && parcelInvoice.error.type
                },
                isRetracted: false
            } as AssetDecomposeTransactionDoc;
        }
        throw new Error(`Unexpected transaction : ${transaction}`);
    };

    public fromAction = async (action: Action, timestamp: number, parcel: SignedParcel): Promise<ActionDoc> => {
        if (action instanceof AssetTransaction) {
            const transactionDoc = await this.fromTransaction(action.transaction, timestamp, parcel);
            return {
                action: "assetTransaction",
                transaction: transactionDoc
            };
        } else if (action instanceof SetRegularKey) {
            const parcelInvoice = (await this.sdk.rpc.chain.getParcelInvoice(parcel.hash())) as Invoice;
            const actionJson = action.toJSON();
            return {
                action: "setRegularKey",
                key: actionJson.key,
                invoice: parcelInvoice && parcelInvoice.success,
                errorType: parcelInvoice && parcelInvoice.error && parcelInvoice.error.type
            };
        } else if (action instanceof Payment) {
            const actionJson = action.toJSON();
            const parcelInvoice = (await this.sdk.rpc.chain.getParcelInvoice(parcel.hash())) as Invoice;
            return {
                action: "payment",
                receiver: actionJson.receiver,
                amount: actionJson.amount as string,
                invoice: parcelInvoice && parcelInvoice.success,
                errorType: parcelInvoice && parcelInvoice.error && parcelInvoice.error.type
            };
        } else if (action instanceof CreateShard) {
            const parcelInvoice = (await this.sdk.rpc.chain.getParcelInvoice(parcel.hash())) as Invoice;
            return {
                action: "createShard",
                invoice: parcelInvoice && parcelInvoice.success,
                errorType: parcelInvoice && parcelInvoice.error && parcelInvoice.error.type
            };
        } else if (action instanceof SetShardOwners) {
            const parcelInvoice = (await this.sdk.rpc.chain.getParcelInvoice(parcel.hash())) as Invoice;
            return {
                action: "setShardOwners",
                shardId: action.shardId,
                owners: _.map(action.owners, owner => owner.value),
                invoice: parcelInvoice && parcelInvoice.success,
                errorType: parcelInvoice && parcelInvoice.error && parcelInvoice.error.type
            };
        } else if (action instanceof SetShardUsers) {
            const parcelInvoice = (await this.sdk.rpc.chain.getParcelInvoice(parcel.hash())) as Invoice;
            return {
                action: "setShardUsers",
                shardId: action.shardId,
                users: _.map(action.users, user => user.value),
                invoice: parcelInvoice && parcelInvoice.success,
                errorType: parcelInvoice && parcelInvoice.error && parcelInvoice.error.type
            };
        }
        throw new Error(`Unexpected action : ${action}`);
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
            seq: (parcel.unsigned.seq && parcel.unsigned.seq.value.toString(10)) || "0",
            fee: (parcel.unsigned.fee && parcel.unsigned.fee.value.toString(10)) || "0",
            networkId: parcel.unsigned.networkId,
            signer: owner.value,
            sig: parcel.toJSON().sig,
            hash: parcel.hash().value,
            action,
            timestamp,
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
            registrar: assetScheme.registrar && assetScheme.registrar.value,
            amount: assetScheme.amount.toString(10),
            networkId: assetScheme.networkId,
            shardId: assetScheme.shardId
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
        const assetScheme = await this.db.getAssetScheme(assetType);
        if (assetScheme) {
            return assetScheme;
        }
        const currentBlockNumber = await this.sdk.rpc.chain.getBestBlockNumber();
        const currentBlock = await this.sdk.rpc.chain.getBlock(currentBlockNumber);
        if (currentBlock) {
            const txs = _.chain(currentBlock.parcels)
                .filter(parcel => parcel.unsigned.action instanceof AssetTransaction)
                .map(parcel => (parcel.unsigned.action as AssetTransaction).transaction)
                .value();
            const mintComposeTxs = _.filter(
                txs,
                tx => tx instanceof AssetMintTransaction || tx instanceof AssetComposeTransaction
            );
            const foundMintComposeTx = _.find(
                mintComposeTxs,
                tx =>
                    (tx as AssetMintTransaction | AssetComposeTransaction).getAssetSchemeAddress().value ===
                    assetType.value
            );
            if (foundMintComposeTx) {
                return this.fromAssetScheme(
                    (foundMintComposeTx as AssetMintTransaction | AssetComposeTransaction).getAssetScheme()
                );
            }
        }
        const pendingParcels = await this.sdk.rpc.chain.getPendingParcels();
        const pendingMintComposeTransactions = _.chain(pendingParcels)
            .filter(parcel => parcel.unsigned.action instanceof AssetTransaction)
            .map(parcel => (parcel.unsigned.action as AssetTransaction).transaction)
            .filter(tx => tx instanceof AssetMintTransaction || tx instanceof AssetComposeTransaction)
            .map(tx => tx as AssetMintTransaction | AssetComposeTransaction)
            .value();
        const pendingMintComposeTransaction = _.find(
            pendingMintComposeTransactions,
            (tx: AssetMintTransaction | AssetComposeTransaction) => tx.getAssetSchemeAddress().value === assetType.value
        );
        if (pendingMintComposeTransaction) {
            return this.fromAssetScheme(pendingMintComposeTransaction.getAssetScheme());
        }
        throw new Error(`Invalid asset type : ${assetType.value}`);
    };
}
