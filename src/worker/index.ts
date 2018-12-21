import { SDK } from "codechain-sdk";
import { Block, U64 } from "codechain-sdk/lib/core/classes";
import { Job, scheduleJob } from "node-schedule";
import { InvalidBlockNumber, InvalidParcel } from "../exception";
import { BlockAttribute } from "../models/block";
import * as BlockModel from "../models/logic/block";
import * as AccountUtil from "./account";

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
                "lastest indexed block number : %d",
                latestIndexedBlockInst.get({ plain: true }).number
            );
        }
        console.log(
            "lastest codechain block number : %d",
            chainBestBlockNumber
        );

        let lastIndexedBlockNumber = latestIndexedBlockInst
            ? latestIndexedBlockInst.get().number
            : -1;
        while (lastIndexedBlockNumber < chainBestBlockNumber) {
            const nextBlockNumber = lastIndexedBlockNumber + 1;
            const nextBlock = await sdk.rpc.chain.getBlock(nextBlockNumber);
            if (!nextBlock) {
                throw InvalidBlockNumber;
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
        console.log("================ sync done ===================\n");
    };

    private checkRetractAndReturnSyncNumber = async (
        currentBlockNumber: number
    ) => {
        const { sdk } = this.context;
        while (currentBlockNumber > -1) {
            const currentIndexedBlockInst = await BlockModel.getByNumber(
                currentBlockNumber
            );
            const currentIndexedBlock = currentIndexedBlockInst!.get({
                plain: true
            });
            const currentCodeChainBlock = await sdk.rpc.chain.getBlock(
                currentBlockNumber
            );
            if (!currentCodeChainBlock) {
                throw InvalidBlockNumber;
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
            if (miningRewardResponse == undefined) {
                throw InvalidBlockNumber;
            }
            miningReward = miningRewardResponse;
        }
        const invoices = await Promise.all(
            block.parcels.map(async parcel => {
                const invoice = await sdk.rpc.chain.getParcelInvoice(
                    parcel.hash()
                );
                if (!invoice) {
                    throw InvalidParcel;
                }
                return {
                    invoice: invoice.success,
                    errorType: invoice.error ? invoice.error.type : null
                };
            })
        );
        await BlockModel.createBlock(block, {
            miningReward: new U64(miningReward),
            invoices
        });
        const blockInstance = await BlockModel.getByHash(block.hash);
        await AccountUtil.updateAccount(
            blockInstance!.get({ plain: true }),
            {
                checkingBlockNumber: block.number
            },
            this.context
        );
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
    };
}
