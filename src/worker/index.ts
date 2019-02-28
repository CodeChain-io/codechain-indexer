import { SDK } from "codechain-sdk";
import { Block, H256, U64 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import { Job, scheduleJob } from "node-schedule";
import { InvalidBlockNumber } from "../exception";
import { BlockAttribute } from "../models/block";
import * as BlockModel from "../models/logic/block";
import * as TxModel from "../models/logic/transaction";
import * as AccountUtil from "./account";
import * as LogUtil from "./log";

export interface WorkerContext {
    sdk: SDK;
}

export interface WorkerConfig {
    watchSchedule: string;
}
export default class Worker {
    public context: WorkerContext;
    private watchJob!: Job;
    private jobIsRunning: boolean;
    private config: WorkerConfig;

    constructor(context: WorkerContext, config: WorkerConfig) {
        this.context = context;
        this.config = config;
        this.jobIsRunning = false;
    }

    public destroy() {
        if (this.watchJob) {
            this.watchJob.cancel(false);
        }
    }

    public run = async () => {
        try {
            await this.sync();
        } catch (error) {
            console.log(error);
            return;
        }
        this.watchJob = scheduleJob(this.config.watchSchedule, async () => {
            try {
                await this.sync();
            } catch (error) {
                console.error(error);
                this.watchJob.cancel(false);
            }
        });
    };

    public sync = async () => {
        console.log("================ sync start ==================");
        await this.waitForJobFinish();
        this.jobIsRunning = true;
        await this.indexTransactionsAndSync();
        this.jobIsRunning = false;
        console.log("================ sync done ===================\n");
    };

    private waitForJobFinish = async (): Promise<void> => {
        while (this.jobIsRunning === true) {
            await new Promise(resolve => {
                setTimeout(resolve, 1000);
            });
        }
    };

    private indexTransactionsAndSync = async (): Promise<void> => {
        const { sdk } = this.context;
        const latestIndexedBlockInst = await BlockModel.getLatestBlock();
        const chainBestBlockNumber = await sdk.rpc.chain.getBestBlockNumber();
        if (!latestIndexedBlockInst) {
            console.log("There is no synchronized block");
        } else {
            console.log(
                "latest indexed block number : %d",
                latestIndexedBlockInst.get({ plain: true }).number
            );
        }
        console.log("latest codechain block number : %d", chainBestBlockNumber);

        let lastIndexedBlockNumber = latestIndexedBlockInst
            ? latestIndexedBlockInst.get().number
            : -1;
        while (lastIndexedBlockNumber < chainBestBlockNumber) {
            const nextBlockNumber = lastIndexedBlockNumber + 1;
            const nextBlock = await sdk.rpc.chain.getBlock(nextBlockNumber);
            if (!nextBlock) {
                throw InvalidBlockNumber();
            }
            if (lastIndexedBlockNumber > 0) {
                const lastIndexedBlockInst = await BlockModel.getByNumber(
                    lastIndexedBlockNumber
                );
                const lastIndexedBlock = lastIndexedBlockInst!.get({
                    plain: true
                });
                if (nextBlock.parentHash.value !== lastIndexedBlock.hash) {
                    lastIndexedBlockNumber = await this.checkRetractAndReturnSyncNumber(
                        lastIndexedBlockNumber
                    );
                    continue;
                }
            }
            console.log("%d block is indexing...", nextBlockNumber);
            await this.indexNewBlock(nextBlock);
            console.log("%d block is synchronized", nextBlockNumber);
            lastIndexedBlockNumber = nextBlockNumber;
        }
        await this.indexPendingTransaction();
    };

    private checkRetractAndReturnSyncNumber = async (
        currentBlockNumber: number
    ) => {
        const { sdk } = this.context;
        while (currentBlockNumber > -1) {
            const currentIndexedBlock = (await BlockModel.getByNumber(
                currentBlockNumber
            ))!.get({ plain: true });
            const currentCodeChainBlock = await sdk.rpc.chain.getBlock(
                currentBlockNumber
            );
            if (!currentCodeChainBlock) {
                throw InvalidBlockNumber();
            }

            if (currentCodeChainBlock.hash.value === currentIndexedBlock.hash) {
                break;
            }

            console.log("%d block is retracting...", currentBlockNumber);
            await this.deleteBlock(currentIndexedBlock);
            console.log("%d block is retracted", currentBlockNumber);
            currentBlockNumber--;
        }
        return currentBlockNumber;
    };

    private indexNewBlock = async (block: Block) => {
        const { sdk } = this.context;

        let miningReward;
        if (block.number === 0) {
            miningReward = 0;
        } else {
            const miningRewardResponse = await sdk.rpc.sendRpcRequest(
                "chain_getMiningReward",
                [block.number]
            );
            if (miningRewardResponse === undefined) {
                throw InvalidBlockNumber();
            }
            miningReward = miningRewardResponse;
        }
        const results = await Promise.all(
            block.transactions.map(async tx => {
                if (tx.result!) {
                    return {
                        success: true,
                        errorHint: undefined
                    };
                }
                const errorHint = await sdk.rpc.chain.getErrorHint(tx.hash());
                return {
                    success: false,
                    errorHint: errorHint ? errorHint : undefined
                };
            })
        );
        try {
            await BlockModel.createBlock(block, sdk, {
                miningReward: new U64(miningReward),
                results
            });
        } catch (err) {
            await BlockModel.deleteBlockByNumber(block.number);
            throw err;
        }
        const blockInstance = await BlockModel.getByHash(block.hash);
        const blockAttribute = blockInstance!.get({ plain: true });
        await AccountUtil.updateAccount(
            blockAttribute,
            {
                checkingBlockNumber: block.number
            },
            this.context
        );
        await LogUtil.indexLog(blockAttribute, false);
    };

    private deleteBlock = async (block: BlockAttribute) => {
        await BlockModel.deleteBlockByNumber(block.number);
        await AccountUtil.updateAccount(
            block,
            {
                checkingBlockNumber: block.number - 1
            },
            this.context
        );
        await LogUtil.indexLog(block, true);
    };

    private indexPendingTransaction = async () => {
        console.log("======== indexing pending transactions =======");
        const pendings = await this.context.sdk.rpc.chain.getPendingTransactions();
        const indexeds = await TxModel.getPendingTransactions({}).then(
            instances => instances.map(i => i.get({ plain: true }))
        );

        console.log(`Indexed: ${indexeds.length} / RPC: ${pendings.length}`);

        // Remove dropped pending transactions
        const pendingHashes = pendings.map(p => p.hash().value);
        const droppedPendingHashes = indexeds
            .filter(indexed => !pendingHashes.includes(indexed.hash))
            .map(tx => new H256(tx.hash));
        if (droppedPendingHashes.length > 0) {
            TxModel.removePendings(droppedPendingHashes);
        }

        // Index new pending transactions
        const indexedHashes = _.map(indexeds, p => p.hash);
        const newPendingTransactions = _.filter(
            pendings,
            pending => !_.includes(indexedHashes, pending.hash().value)
        );
        for (const pending of newPendingTransactions) {
            await TxModel.createTransaction(pending, this.context.sdk, true);
        }
    };
}
