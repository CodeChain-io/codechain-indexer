import { H256, SignedParcel } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import models from "../index";
import { ParcelInstance } from "../parcel";
import * as BlockModel from "./block";

export async function createParcel(parcel: SignedParcel): Promise<ParcelInstance> {
    const blockHash = parcel.toJSON().blockHash;
    if (!blockHash) {
        throw Exception.InvalidParcel;
    }
    const blockInstance = await BlockModel.getByHash(new H256(blockHash));
    if (!blockInstance) {
        throw Exception.InvalidParcel;
    }
    const block = blockInstance.get({ plain: true });
    if (
        parcel.unsigned.seq == undefined ||
        parcel.unsigned.fee == undefined ||
        parcel.blockHash == undefined ||
        parcel.blockNumber == undefined ||
        parcel.parcelIndex == undefined
    ) {
        throw Exception.InvalidParcel;
    }
    let parcelInstance: ParcelInstance;
    try {
        parcelInstance = await models.Parcel.create({
            seq: parcel.unsigned.seq,
            fee: parcel.unsigned.fee.value.toString(10),
            networkId: parcel.unsigned.networkId,
            sig: parcel.toJSON().sig,
            hash: parcel.hash().value,
            signer: parcel.getSignerAddress({ networkId: parcel.unsigned.networkId }).value,
            timestamp: block.timestamp,
            blockHash: parcel.blockHash.value,
            blockNumber: parcel.blockNumber,
            parcelIndex: parcel.parcelIndex
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
    return parcelInstance;
}

export async function getByHash(hash: H256): Promise<ParcelInstance | null> {
    try {
        return await models.Parcel.findOne({
            where: {
                hash: hash.value
            },
            include: [
                {
                    as: "action",
                    model: models.Action
                }
            ]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
