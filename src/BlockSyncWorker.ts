import { ElasticSearchAgent } from "codechain-es";
import { LogType } from "codechain-es/lib/actions/QueryLog";
import { AssetMintTransactionDoc, AssetTransferTransactionDoc, BlockDoc, PaymentDoc } from "codechain-es/lib/types";
import { Type, TypeConverter } from "codechain-es/lib/utils";
import { SDK } from "codechain-sdk";
import { Block, H256 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as moment from "moment";
import { Job, scheduleJob } from "node-schedule";
import * as sharp from "sharp";
import { WorkerConfig } from "./";
const pLimit = require("p-limit");
const request = require("request-promise-native");

export class BlockSyncWorker {
    private watchJob!: Job;
    private config: WorkerConfig;
    private sdk: SDK;
    private elasticSearchAgent: ElasticSearchAgent;
    private typeConverter: TypeConverter;

    private jobIsRunning: boolean;

    constructor(config: WorkerConfig) {
        this.config = config;
        this.elasticSearchAgent = new ElasticSearchAgent(config.elasticSearch.host);
        this.typeConverter = new TypeConverter(config.codeChain.host, config.codeChain.networkId);
        this.sdk = new SDK({ server: config.codeChain.host, networkId: config.codeChain.networkId });
        this.jobIsRunning = false;
    }

    public start() {
        this.startSync();
    }

    public destroy() {
        if (this.watchJob) {
            this.watchJob.cancel(false);
        }
    }

    private async startSync() {
        try {
            await this.sync();
        } catch (error) {
            console.error(error);
            return;
        }
        this.watchJob = scheduleJob(this.config.cron.blockWatch, async () => {
            if (this.jobIsRunning) {
                return;
            }
            this.jobIsRunning = true;
            try {
                await this.sync();
            } catch (error) {
                console.error(error);
            }
            this.jobIsRunning = false;
        });
    }

    private async sync() {
        console.log("================ sync start ==================");
        await this.elasticSearchAgent.checkIndexOrCreate();
        let latestSyncBlockNumber: number = await this.elasticSearchAgent.getLastBlockNumber();
        const latestCodechainBlockNumber: number = await this.sdk.rpc.chain.getBestBlockNumber();
        if (latestSyncBlockNumber === -1) {
            console.log("There is no synchronized block");
        } else {
            console.log("lastest indexed block number : %d", latestSyncBlockNumber);
        }
        console.log("lastest codechain block number : %d", latestCodechainBlockNumber);
        let isIndexingNewBlock = false;
        while (latestSyncBlockNumber < latestCodechainBlockNumber) {
            isIndexingNewBlock = true;
            const nextBlockIndex: number = latestSyncBlockNumber + 1;
            const nextBlockHash = await this.sdk.rpc.chain.getBlockHash(nextBlockIndex);
            if (!nextBlockHash) {
                throw new Error("Invalid block number");
            }
            const nextBlock = await this.sdk.rpc.chain.getBlock(nextBlockHash);
            if (!nextBlock) {
                throw new Error("Invalid block hash");
            }
            if (latestSyncBlockNumber > 0) {
                const lastSyncBlock = await this.elasticSearchAgent.getBlock(latestSyncBlockNumber);
                if (!lastSyncBlock) {
                    throw new Error("Invalid sync block number");
                }
                if (nextBlock.parentHash.value !== lastSyncBlock.hash) {
                    latestSyncBlockNumber = await this.checkRetractAndReturnSyncNumber(latestSyncBlockNumber);
                    continue;
                }
            }
            console.log("%d block is indexing...", nextBlockIndex);
            await this.indexingNewBlock(nextBlock);
            console.log("%d block is synchronized", nextBlockIndex);
            latestSyncBlockNumber = nextBlockIndex;
        }
        if (isIndexingNewBlock) {
            await this.delay(5000);
        }
        await this.indexingPendingParcel();
        console.log("================ sync done ===================\n");
    }
    private delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    private indexingPendingParcel = async () => {
        console.log("========== indexing pending parcels ==========");
        const pendingParcels = await this.sdk.rpc.chain.getPendingParcels();
        const indexedParcels = await this.elasticSearchAgent.getAllOfCurrentPendingParcels();

        console.log("current indexed pending parcels : %d", indexedParcels.length);
        console.log("codechain pending parcels : %d", pendingParcels.length);

        // Update pending parcel status
        const pendingParcelHashList = _.map(pendingParcels, p => p.hash().value);
        const removedPendingParcels = _.filter(
            indexedParcels,
            indexedParcel => !_.includes(pendingParcelHashList, indexedParcel.parcel.hash)
        );
        await this.runWithLimit(
            _.map(removedPendingParcels, removedPendingParcel => async () => {
                const blockedParcel = await this.elasticSearchAgent.getParcel(
                    new H256(removedPendingParcel.parcel.hash)
                );
                if (blockedParcel) {
                    return this.elasticSearchAgent.removePendingParcel(new H256(removedPendingParcel.parcel.hash));
                } else {
                    const mintTxs = Type.getMintTransactionsByParcel(removedPendingParcel.parcel);
                    for (const mintTx of mintTxs) {
                        await this.handleAssetImage(mintTx as AssetMintTransactionDoc, true);
                    }
                    return this.elasticSearchAgent.deadPendingParcel(new H256(removedPendingParcel.parcel.hash));
                }
            }),
            100
        );

        // Index new pending parcel
        const indexedPendingParcelHashList = _.map(indexedParcels, p => p.parcel.hash);
        const newPendingParcels = _.filter(
            pendingParcels,
            pendingParcel => !_.includes(indexedPendingParcelHashList, pendingParcel.hash().value)
        );
        await this.runWithLimit(
            _.map(newPendingParcels, pendingParcel => async () => {
                const pendingParcelDoc = await this.typeConverter.fromPendingParcel(pendingParcel);
                const mintTxs = Type.getMintTransactionsByParcel(pendingParcelDoc.parcel);
                for (const mintTx of mintTxs) {
                    await this.handleAssetImage(mintTx as AssetMintTransactionDoc, false);
                }
                return this.elasticSearchAgent.indexPendingParcel(pendingParcelDoc);
            }),
            100
        );

        // Revival pending parcel
        const deadPendingParcels = await this.elasticSearchAgent.getDeadPendingParcels();
        const deadPendingParcelHashList = _.map(deadPendingParcels, p => p.parcel.hash);
        const revivalPendingParcels = _.filter(pendingParcels, pendingParcel =>
            _.includes(deadPendingParcelHashList, pendingParcel.hash().value)
        );
        await this.runWithLimit(
            _.map(revivalPendingParcels, revivalPendingParcel => async () => {
                const pendingParcelDoc = await this.typeConverter.fromPendingParcel(revivalPendingParcel);
                const mintTxs = Type.getMintTransactionsByParcel(pendingParcelDoc.parcel);
                for (const mintTx of mintTxs) {
                    await this.handleAssetImage(mintTx as AssetMintTransactionDoc, true);
                }
                return this.elasticSearchAgent.revialPendingParcel(new H256(pendingParcelDoc.parcel.hash));
            }),
            100
        );
    };

    private checkRetractAndReturnSyncNumber = async (currentBlockNumber: number): Promise<number> => {
        while (currentBlockNumber > -1) {
            const lastSynchronizedBlock = await this.elasticSearchAgent.getBlock(currentBlockNumber);
            if (!lastSynchronizedBlock) {
                throw new Error("Invalid block number");
            }
            const codechainBlockHash = await this.sdk.rpc.chain.getBlockHash(currentBlockNumber);
            if (!codechainBlockHash) {
                throw new Error("Invalid block number");
            }
            const codechainBlock = await this.sdk.rpc.chain.getBlock(codechainBlockHash);
            if (!codechainBlock) {
                throw new Error("Invalid block hash");
            }
            if (codechainBlock.hash.value === lastSynchronizedBlock.hash) {
                break;
            }

            console.log("%d block is retracting...", currentBlockNumber);
            await this.retractBlock(lastSynchronizedBlock);
            console.log("%d block is retracted", currentBlockNumber);
            currentBlockNumber--;
        }
        return currentBlockNumber;
    };

    private indexingNewBlock = async (nextBlock: Block) => {
        const blockDoc = await this.typeConverter.fromBlock(
            nextBlock,
            this.config.miningReward[(process.env.CODECHAIN_CHAIN as "solo" | "husky" | "saluki" | undefined) || "solo"]
        );
        if (blockDoc.number === 0) {
            await this.handleGenesisBlock();
        }
        await this.runWithLimit(
            _.map(blockDoc.parcels, parcel => async () => {
                return this.elasticSearchAgent.indexParcel(parcel);
            }),
            100
        );
        const transactions = Type.getTransactionsByBlock(blockDoc);
        await this.runWithLimit(
            _.map(transactions, transaction => async () => await this.elasticSearchAgent.indexTransaction(transaction)),
            100
        );
        await this.handleAsset(blockDoc, false);
        await this.handleLogData(blockDoc, false);
        await this.handleBalance(blockDoc, false);

        await this.elasticSearchAgent.indexBlock(blockDoc);
    };

    private retractBlock = async (retractedBlock: BlockDoc) => {
        await this.runWithLimit(
            _.map(retractedBlock.parcels, parcel => async () =>
                await this.elasticSearchAgent.retractParcel(new H256(parcel.hash))
            ),
            100
        );
        const transactions = Type.getTransactionsByBlock(retractedBlock);
        await this.runWithLimit(
            _.map(transactions, transaction => async () =>
                await this.elasticSearchAgent.retractTransaction(new H256(transaction.data.hash))
            ),
            100
        );
        await this.handleAsset(retractedBlock, true);
        await this.handleLogData(retractedBlock, true);
        await this.handleBalance(retractedBlock, true);

        await this.elasticSearchAgent.retractBlock(new H256(retractedBlock.hash));
    };

    private queryLog = async (
        isRetract: boolean,
        dateString: string,
        logType: LogType,
        count: number,
        value?: string
    ) => {
        if (isRetract) {
            await this.elasticSearchAgent.decreaseLogCount(dateString, logType, count, value);
        } else {
            await this.elasticSearchAgent.increaseLogCount(dateString, logType, count, value);
        }
    };

    private handleAsset = async (blockDoc: BlockDoc, isRetract: boolean) => {
        const transactions = Type.getTransactionsByBlock(blockDoc);
        for (const transaction of transactions) {
            if (Type.isAssetMintTransactionDoc(transaction)) {
                const mintTx = transaction as AssetMintTransactionDoc;
                if (mintTx.data.output.owner !== "") {
                    if (isRetract) {
                        await this.elasticSearchAgent.removeAsset(
                            mintTx.data.output.owner,
                            new H256(mintTx.data.output.assetType),
                            new H256(mintTx.data.hash),
                            mintTx.data.transactionIndex
                        );
                    } else {
                        const assetDoc = {
                            assetType: mintTx.data.output.assetType,
                            lockScriptHash: mintTx.data.output.lockScriptHash,
                            parameters: mintTx.data.output.parameters,
                            amount: mintTx.data.output.amount || 0,
                            transactionHash: mintTx.data.hash,
                            transactionOutputIndex: 0
                        };
                        await this.elasticSearchAgent.indexAsset(
                            mintTx.data.output.owner,
                            assetDoc,
                            mintTx.data.blockNumber,
                            mintTx.data.parcelIndex,
                            mintTx.data.transactionIndex
                        );
                    }
                }
            } else if (Type.isAssetTransferTransactionDoc(transaction)) {
                const transferTx = transaction as AssetTransferTransactionDoc;
                const inputs = transferTx.data.inputs;
                const outputs = transferTx.data.outputs;

                for (const input of inputs) {
                    if (input.prevOut.owner !== "") {
                        if (isRetract) {
                            await this.elasticSearchAgent.revivalAsset(
                                input.prevOut.owner,
                                new H256(input.prevOut.assetType),
                                new H256(input.prevOut.transactionHash),
                                input.prevOut.index
                            );
                        } else {
                            await this.elasticSearchAgent.removeAsset(
                                input.prevOut.owner,
                                new H256(input.prevOut.assetType),
                                new H256(input.prevOut.transactionHash),
                                input.prevOut.index
                            );
                        }
                    }
                }

                for (const [index, output] of outputs.entries()) {
                    if (output.owner !== "") {
                        if (isRetract) {
                            await this.elasticSearchAgent.removeAsset(
                                output.owner,
                                new H256(output.assetType),
                                new H256(transaction.data.hash),
                                index
                            );
                        } else {
                            const assetDoc = {
                                assetType: output.assetType,
                                lockScriptHash: output.lockScriptHash,
                                parameters: output.parameters,
                                amount: output.amount,
                                transactionHash: transaction.data.hash,
                                transactionOutputIndex: index
                            };
                            await this.elasticSearchAgent.indexAsset(
                                output.owner,
                                assetDoc,
                                transaction.data.blockNumber,
                                transaction.data.parcelIndex,
                                transaction.data.transactionIndex
                            );
                        }
                    }
                }
            }
        }

        const assetMintTransactions = _.filter(transactions, tx => Type.isAssetMintTransactionDoc(tx));
        for (const mintTx of assetMintTransactions) {
            await this.handleAssetImage(mintTx as AssetMintTransactionDoc, isRetract);
        }
    };

    private handleLogData = async (blockDoc: BlockDoc, isRetract: boolean) => {
        const dateString = moment
            .unix(blockDoc.timestamp)
            .utc()
            .format("YYYY-MM-DD");
        await this.queryLog(isRetract, dateString, LogType.BLOCK_COUNT, 1);
        await this.queryLog(isRetract, dateString, LogType.BLOCK_MINING_COUNT, 1, blockDoc.author);
        const parcelCount = blockDoc.parcels.length;
        if (parcelCount > 0) {
            await this.queryLog(isRetract, dateString, LogType.PARCEL_COUNT, parcelCount);
            const paymentParcelCount = _.filter(blockDoc.parcels, p => Type.isPaymentDoc(p.action)).length;
            await this.queryLog(isRetract, dateString, LogType.PARCEL_PAYMENT_COUNT, paymentParcelCount);
            const serRegularKeyParcelCount = _.filter(blockDoc.parcels, p => Type.isSetRegularKeyDoc(p.action)).length;
            await this.queryLog(isRetract, dateString, LogType.PARCEL_SET_REGULAR_KEY_COUNT, serRegularKeyParcelCount);
            const assetTransactionGroupParcelCount = _.filter(blockDoc.parcels, p =>
                Type.isAssetTransactionGroupDoc(p.action)
            ).length;
            await this.queryLog(
                isRetract,
                dateString,
                LogType.PARCEL_ASSET_TRANSACTION_GROUP_COUNT,
                assetTransactionGroupParcelCount
            );
        }
        const transactions = Type.getTransactionsByBlock(blockDoc);
        const txCount = transactions.length;
        if (txCount > 0) {
            await this.queryLog(isRetract, dateString, LogType.TX_COUNT, txCount);
            const assetMintTxCount = _.filter(transactions, tx => Type.isAssetMintTransactionDoc(tx)).length;
            await this.queryLog(isRetract, dateString, LogType.TX_ASSET_MINT_COUNT, assetMintTxCount);
            const assetTransferTxCount = _.filter(transactions, tx => Type.isAssetTransferTransactionDoc(tx)).length;
            await this.queryLog(isRetract, dateString, LogType.TX_ASSET_TRANSFER_COUNT, assetTransferTxCount);
        }
    };

    private handleBalance = async (blockDoc: BlockDoc, isRetract: boolean) => {
        const affectedAddresses = new Array<string>();
        affectedAddresses.push(blockDoc.author);
        for (const parcel of blockDoc.parcels) {
            affectedAddresses.push(parcel.signer);
        }
        const paymentParcels = _.filter(blockDoc.parcels, parcel => Type.isPaymentDoc(parcel.action));
        _.each(paymentParcels, parcel => async () => {
            const paymentAction = parcel.action as PaymentDoc;
            if (paymentAction.invoice) {
                affectedAddresses.push(paymentAction.receiver);
            }
        });
        let checkingBlockNumber = 0;
        if (isRetract) {
            checkingBlockNumber = blockDoc.number - 1;
        } else {
            checkingBlockNumber = blockDoc.number;
        }

        await this.runWithLimit(
            _.map(_.uniq(affectedAddresses), address => async () => {
                const balance = await this.sdk.rpc.chain.getBalance(address, checkingBlockNumber);
                return this.elasticSearchAgent.updateAccount(address, balance.value.toString(10));
            }),
            100
        );
    };

    private handleAssetImage = async (assetMintTx: AssetMintTransactionDoc, isRetract: boolean) => {
        const metadata = Type.getMetadata(assetMintTx.data.metadata);
        if (!metadata || !metadata.icon_url) {
            return;
        }
        const iconUrl = metadata.icon_url;
        const assetType = assetMintTx.data.output.assetType;
        if (!isRetract) {
            const isExists = await this.elasticSearchAgent.getAssetImageBlob(new H256(assetType));
            if (!isExists) {
                let imageDataBuffer;
                try {
                    const imageBuffer = await request({ url: iconUrl, encoding: null });
                    if (imageBuffer) {
                        imageDataBuffer = await sharp(imageBuffer)
                            .resize(65, 65)
                            .png()
                            .toBuffer();
                    }
                } catch (e) {
                    // nothing
                }
                if (imageDataBuffer) {
                    await this.elasticSearchAgent.indexImage(new H256(assetType), imageDataBuffer.toString("base64"));
                }
            }
        } else {
            await this.elasticSearchAgent.removeImage(new H256(assetType));
        }
    };

    private handleGenesisBlock = async () => {
        const addressListJob = _.map(
            this.config.genesisAddressList[
                (process.env.CODECHAIN_CHAIN as "solo" | "husky" | "saluki" | undefined) || "solo"
            ],
            address => async () => {
                const balance = await this.sdk.rpc.chain.getBalance(address, 0);
                return {
                    address,
                    balance: balance.value.toString(10)
                };
            }
        );
        const addressList = await this.runWithLimit(addressListJob, 100);
        const updateAddressJob = _.map(addressList, address => () =>
            this.elasticSearchAgent.updateAccount(address.address, address.balance)
        );
        await this.runWithLimit(updateAddressJob, 100);
    };

    private runWithLimit = async (tasks: (() => Promise<any>)[], limitNumber: number) => {
        const limit = pLimit(limitNumber);
        const limitTasks = _.map(tasks, task => {
            return limit(task);
        });
        return Promise.all(limitTasks);
    };
}
