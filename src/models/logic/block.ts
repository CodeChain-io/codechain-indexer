import { SDK } from "codechain-sdk";
import { Block, H256, U64 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { BlockInstance } from "../block";
import models from "../index";
import * as AddressLogModel from "./addressLog";
import * as AssetTypeLogModel from "./assetTypeLog";
import * as TxModel from "./transaction";
import { strip0xPrefix } from "./utils/format";

export async function createBlock(
    block: Block,
    sdk: SDK,
    miningReward: U64,
    options: {
        transaction?: Sequelize.Transaction;
    } = {}
): Promise<BlockInstance> {
    const { transaction } = options;
    let blockInstance: BlockInstance;
    try {
        blockInstance = await models.Block.create(
            {
                parentHash: strip0xPrefix(block.parentHash.value),
                timestamp: block.timestamp,
                number: block.number,
                author: block.author.value,
                extraData: Buffer.from(block.extraData),
                transactionsRoot: strip0xPrefix(block.transactionsRoot.value),
                stateRoot: strip0xPrefix(block.stateRoot.value),
                score: block.score.value.toString(10),
                seal: block.seal.map(s => Buffer.from(s)),
                hash: strip0xPrefix(block.hash.value),
                miningReward: miningReward.value.toString(10),
                transactionsCount: block.transactions.length,
                transactionsCountByType: getTransactionsCountByType(block),
                size: block.getSize()
            },
            { transaction }
        );

        const newTxs = [];
        for (const tx of block.transactions) {
            if (
                (await TxModel.tryUpdateTransaction(
                    tx,
                    block.timestamp,
                    options
                )) == null
            ) {
                newTxs.push(tx);
            } else {
                await AddressLogModel.updateAddressLog(tx, options);
                await AssetTypeLogModel.updateAssetTypeLog(tx, options);
            }
        }
        await TxModel.createTransactions(
            newTxs,
            false,
            block.timestamp,
            options
        );

        for (const tx of block.transactions) {
            await TxModel.applyTransaction(tx, sdk, block.number, options);
        }
    } catch (err) {
        if (err instanceof Sequelize.UniqueConstraintError) {
            const duplicateFields = (err as any).fields;
            if (_.has(duplicateFields, "hash")) {
                throw Exception.AlreadyExist();
            }
        }
        console.error(err);
        throw Exception.DBError();
    }
    return blockInstance;
}

export async function getByHash(
    hash: H256,
    options: { transaction?: Sequelize.Transaction } = {}
): Promise<BlockInstance | null> {
    try {
        const { transaction } = options;
        return await models.Block.findOne({
            where: {
                hash: strip0xPrefix(hash.value)
            },
            transaction
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function deleteBlockByNumber(
    blockNumber: number
): Promise<number> {
    try {
        return await models.Block.destroy({
            where: { number: blockNumber }
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError();
    }
}

export async function getBlocks(params: {
    address?: string;
    page?: number | null;
    itemsPerPage?: number | null;
}) {
    const { page = 1, itemsPerPage = 15, address } = params;
    let query = {};
    if (address) {
        query = {
            author: address
        };
    }
    try {
        return await models.Block.findAll({
            order: [["number", "DESC"]],
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!,
            where: query
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError();
    }
}

export async function getNumberOfBlocks(params: { address?: string }) {
    const { address } = params;
    try {
        if (address) {
            // FIXME: "SELECT count(*) FROM Blocks" takes seconds if the payload
            // is huge. Keep in mind that the size of a block header is around
            // 2KB. We need some count table for the performance.
            return await models.Block.count({
                where: {
                    author: address
                }
            });
        } else {
            const block = await models.Block.findOne({
                attributes: ["number"],
                order: [["number", "DESC"]]
            });
            if (block) {
                // NOTE: Plus 1 because there is a genesis block.
                return block.get("number") + 1;
            } else {
                return 0;
            }
        }
    } catch (err) {
        console.log(err);
        throw Exception.DBError();
    }
}

export async function getLatestBlock(): Promise<BlockInstance | null> {
    try {
        return await models.Block.findOne({
            order: [["number", "DESC"]]
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError();
    }
}

export async function getByNumber(
    blockNumber: number
): Promise<BlockInstance | null> {
    try {
        return await models.Block.findOne({
            where: {
                number: blockNumber
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByTime(
    timestamp: number
): Promise<BlockInstance | null> {
    try {
        const block = await models.Block.findOne({
            where: {
                timestamp: {
                    [Sequelize.Op.lte]: timestamp
                }
            },
            order: [["timestamp", "DESC"], ["number", "DESC"]]
        });

        if (block == null) {
            return null;
        }

        const nextBlock = await getByNumber(block.get("number") + 1);
        if (nextBlock == null || nextBlock.get("timestamp") <= timestamp) {
            // If the `block` is the latest block, the future block's timestamp also could be less than or equal to the timestamp.
            // To ensure the `block` is the nearest block, the `block` should have the next block whose timestamp is greater than the `timestamp`.
            return null;
        }
        return block;
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

function getTransactionsCountByType(block: Block) {
    const transactionsCountByType: { [type: string]: number } = {};
    block.transactions.forEach(t => {
        if (transactionsCountByType[t.unsigned.type()] == null) {
            transactionsCountByType[t.unsigned.type()] = 0;
        }
        transactionsCountByType[t.unsigned.type()] += 1;
    });
    return transactionsCountByType;
}
