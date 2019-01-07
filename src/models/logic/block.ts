import { Block, H256, U64 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { BlockInstance } from "../block";
import models from "../index";
import * as TxModel from "./transaction";

export async function createBlock(
    block: Block,
    params: {
        miningReward: U64;
        invoices: { invoice: boolean; errorType?: string | null }[];
    }
): Promise<BlockInstance> {
    let blockInstance: BlockInstance;
    try {
        blockInstance = await models.Block.create({
            parentHash: block.parentHash.value,
            timestamp: block.timestamp,
            number: block.number,
            author: block.author.value,
            extraData: block.extraData,
            transactionsRoot: block.transactionsRoot.value,
            stateRoot: block.stateRoot.value,
            invoicesRoot: block.invoicesRoot.value,
            score: block.score.value.toString(10),
            seal: block.seal,
            hash: block.hash.value,
            miningReward: params.miningReward.value.toString(10)
        });
        await Promise.all(
            block.transactions.map(async tx => {
                const invoice = params.invoices[tx.transactionIndex!];
                // FIXME: fix tslint to allow ==
                if (invoice === null || invoice === undefined) {
                    throw Error("invalid invoice");
                }
                const txInst = await TxModel.getByHash(tx.hash());
                if (txInst) {
                    await TxModel.updatePendingTransaction(tx.hash(), {
                        timestamp: block.timestamp,
                        invoice: invoice.invoice,
                        errorType: invoice.errorType,
                        transactionIndex: tx.transactionIndex!,
                        blockNumber: tx.blockNumber!,
                        blockHash: tx.blockHash!
                    });
                } else {
                    await TxModel.createTransaction(tx, false, {
                        timestamp: block.timestamp,
                        invoice: invoice.invoice,
                        errorType: invoice.errorType
                    });
                }
            })
        );
    } catch (err) {
        if (err instanceof Sequelize.UniqueConstraintError) {
            const duplicateFields = (err as any).fields;
            if (_.has(duplicateFields, "hash")) {
                throw Exception.AlreadyExist;
            }
        }
        console.error(err);
        throw Exception.DBError;
    }
    return blockInstance;
}

const includeArray = [
    {
        as: "transactions",
        model: models.Transaction,
        include: [
            {
                as: "action",
                model: models.Action,
                include: [
                    {
                        as: "outputs",
                        model: models.AssetTransferOutput
                    },
                    {
                        as: "output",
                        model: models.AssetMintOutput
                    },
                    {
                        as: "inputs",
                        model: models.AssetTransferInput
                    },
                    {
                        as: "input",
                        model: models.AssetDecomposeInput
                    }
                ]
            }
        ]
    }
];

export async function getByHash(hash: H256): Promise<BlockInstance | null> {
    try {
        return await models.Block.findOne({
            where: {
                hash: hash.value
            },
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
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
        throw Exception.DBError;
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
            where: query,
            include: includeArray
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError;
    }
}

export async function getLatestBlock(): Promise<BlockInstance | null> {
    try {
        return await models.Block.findOne({
            order: [["number", "DESC"]],
            include: includeArray
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError;
    }
}

export async function getByNumber(
    blockNumber: number
): Promise<BlockInstance | null> {
    try {
        return await models.Block.findOne({
            where: {
                number: blockNumber
            },
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
