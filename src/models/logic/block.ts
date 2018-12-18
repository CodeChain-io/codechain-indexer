import { Block, H256 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { BlockInstance } from "../block";
import models from "../index";

export async function createBlock(block: Block): Promise<BlockInstance> {
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
            isRetracted: false,
            // TODO: Calculate mining reward
            miningReward: "0"
        });
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

export async function getByHash(hash: H256): Promise<BlockInstance | null> {
    try {
        return await models.Block.find({
            where: {
                hash: hash.value
            },
            include: [
                {
                    as: "parcel",
                    model: models.Parcel
                }
            ]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getByNumber(blockNumber: number): Promise<BlockInstance | null> {
    try {
        return await models.Block.find({
            where: {
                number: blockNumber
            },
            include: [
                {
                    as: "parcel",
                    model: models.Parcel
                }
            ]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
