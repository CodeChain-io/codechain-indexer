import { Block, H256, U64 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { BlockInstance } from "../block";
import models from "../index";
import * as ParcelModel from "./parcel";

export async function createBlock(
    block: Block,
    params: {
        miningReward: U64;
        invoices: { invoice: boolean | null; errorType: string | null }[];
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
            parcelsRoot: block.parcelsRoot.value,
            stateRoot: block.stateRoot.value,
            invoicesRoot: block.invoicesRoot.value,
            score: block.score.value.toString(10),
            seal: block.seal,
            hash: block.hash.value,
            miningReward: params.miningReward.value.toString(10)
        });
        await Promise.all(
            block.parcels.map(async parcel => {
                const invoice = params.invoices[parcel.parcelIndex!];
                const parcelInst = await ParcelModel.getByHash(parcel.hash());
                if (parcelInst) {
                    await ParcelModel.updatePendingParcel(parcel.hash(), {
                        timestamp: block.timestamp,
                        invoice: invoice && invoice.invoice,
                        errorType: invoice && invoice.errorType,
                        parcelIndex: parcel.parcelIndex!,
                        blockNumber: parcel.blockNumber!,
                        blockHash: parcel.blockHash!
                    });
                } else {
                    await ParcelModel.createParcel(parcel, false, {
                        timestamp: block.timestamp,
                        invoice: invoice && invoice.invoice,
                        errorType: invoice && invoice.errorType
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
        as: "parcels",
        model: models.Parcel,
        include: [
            {
                as: "action",
                model: models.Action,
                include: [
                    {
                        as: "transaction",
                        model: models.Transaction,
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
