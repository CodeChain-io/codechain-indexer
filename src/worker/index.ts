import * as AsyncLock from "async-lock";
import { SDK } from "codechain-sdk";
import { Block } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import { Job, scheduleJob } from "node-schedule";
import { InvalidBlockNumber } from "../exception";
import { BlockAttribute } from "../models/block";
import * as BlockModel from "../models/logic/block";
import * as TxModel from "../models/logic/transaction";
import * as AccountUtil from "./account";
import * as LogUtil from "./log";

const ASYNC_LOCK_KEY = "worker";

export interface WorkerContext {
    sdk: SDK;
}

export interface WorkerConfig {
    watchSchedule: string;
}
export default class Worker {
    public context: WorkerContext;
    private watchJob!: Job;
    private config: WorkerConfig;
    private lock: AsyncLock;

    constructor(context: WorkerContext, config: WorkerConfig) {
        this.context = context;
        this.config = config;
        this.lock = new AsyncLock({ timeout: 30000, maxPending: 100 });
    }

    public destroy() {
        if (this.watchJob) {
            this.watchJob.cancel(false);
        }
    }

    public run = async () => {
        this.watchJob = scheduleJob(this.config.watchSchedule, async () => {
            try {
                if (this.lock.isBusy(ASYNC_LOCK_KEY) === false) {
                    await this.sync();
                }
            } catch (err) {
                const error = err as Error;
                if (error.message.search(/ECONNRESET|ECONNREFUSED/) >= 0) {
                    console.error("RPC Error");
                } else {
                    console.error(error);
                    this.watchJob.cancel(false);
                }
            }
        });
        this.watchJob.invoke();
    };

    public sync = async () => {
        const { sdk } = this.context;
        const chainBestBlockNumber = await sdk.rpc.chain.getBestBlockNumber();
        console.log("latest codechain block number : %d", chainBestBlockNumber);
        await this.lock
            .acquire(ASYNC_LOCK_KEY, () => {
                console.log("================ sync start ==================");
                return this.indexTransactionsAndSync(chainBestBlockNumber);
            })
            .then(() => {
                console.log("================ sync done ===================\n");
            })
            .catch(err => {
                console.error(
                    "================ sync failed ===================\n"
                );
                throw err;
            });
    };

    private indexTransactionsAndSync = async (
        chainBestBlockNumber: number
    ): Promise<void> => {
        const { sdk } = this.context;
        const latestIndexedBlockInst = await BlockModel.getLatestBlock();
        if (!latestIndexedBlockInst) {
            console.log("There is no synchronized block");
        } else {
            console.log(
                "latest indexed block number : %d",
                latestIndexedBlockInst.get({ plain: true }).number
            );
        }

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

        const miningReward = await sdk.rpc.chain.getMiningReward(block.number);
        if (miningReward == null) {
            throw InvalidBlockNumber();
        }
        const errorHints: { [transactionIndex: number]: string } = {};
        await Promise.all(
            block.transactions.map(async tx => {
                if (tx.result === false) {
                    errorHints[
                        tx.transactionIndex!
                    ] = (await sdk.rpc.chain.getErrorHint(tx.hash()))!;
                }
            })
        );
        try {
            await BlockModel.createBlock(block, sdk, miningReward, errorHints);
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
        const {
            transactions
        } = await this.context.sdk.rpc.chain.getPendingTransactions();
        const indexedHashes = await TxModel.getAllPendingTransactionHashes();

        console.log(
            `Indexed: ${indexedHashes.length} / RPC: ${transactions.length}`
        );

        // Remove dropped pending transactions
        if (transactions.length > 0) {
            await TxModel.removeOutdatedPendings(transactions);
        }

        // Index new pending transactions
        const newPendingTransactions = _.filter(
            transactions,
            pending => !_.includes(indexedHashes, pending.hash().value)
        );
        await TxModel.createTransactions(newPendingTransactions, true);
    };
}
