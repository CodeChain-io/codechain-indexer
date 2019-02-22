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
            if (this.jobIsRunning) {
                return;
            }
            this.jobIsRunning = true;
            try {
                await this.sync();
            } catch (error) {
                console.error(error);
                this.watchJob.cancel(false);
            }
            this.jobIsRunning = false;
        });
    };

    public sync = async () => {
        console.log("================ sync start ==================");
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
        console.log("================ sync done ===================\n");
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
        const invoices = await Promise.all(
            block.transactions.map(async tx => {
                const invoice = await sdk.rpc.chain.getInvoice(tx.hash());
                if (invoice) {
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
                invoices
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
        console.log("========== indexing pending transactions ==========");
        const pendingTransactions = await this.context.sdk.rpc.chain.getPendingTransactions();
        const indexedTransactionsInst = await TxModel.getPendingTransactions(
            {}
        );
        const indexedTransactions = indexedTransactionsInst.map(inst =>
            inst.get({ plain: true })
        );

        console.log(
            "current indexed pending transactions : %d",
            indexedTransactions.length
        );
        console.log(
            "codechain pending transactions : %d",
            pendingTransactions.length
        );

        // Remove dead pending transactions
        const pendingTxHashList = pendingTransactions.map(p => p.hash().value);
        const removedPendingTransactions = _.filter(
            indexedTransactions,
            indexedTx => !_.includes(pendingTxHashList, indexedTx.hash)
        );
        await Promise.all(
            removedPendingTransactions.map(async removedPendingTransaction => {
                const blockedTxInst = await TxModel.getByHash(
                    new H256(removedPendingTransaction.hash)
                );
                if (!blockedTxInst) {
                    await TxModel.deleteByHash(
                        new H256(removedPendingTransaction.hash)
                    );
                }
            })
        );

        // Index new pending transactions
        const indexedPendingTxHashList = _.map(
            indexedTransactions,
            p => p.hash
        );
        const newPendingTransactions = _.filter(
            pendingTransactions,
            pending =>
                !_.includes(indexedPendingTxHashList, pending.hash().value)
        );
        for (const pending of newPendingTransactions) {
            await TxModel.createTransaction(pending, this.context.sdk, true);
        }
    };
}
