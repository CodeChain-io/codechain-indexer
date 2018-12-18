import { H256, SignedParcel } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
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
    let parcelInstance: ParcelInstance;
    try {
        parcelInstance = await models.Parcel.create({
            seq: parcel.unsigned.seq || 0,
            fee: parcel.unsigned.fee!.value.toString(10),
            networkId: parcel.unsigned.networkId,
            sig: parcel.toJSON().sig,
            hash: parcel.hash().value,
            signer: parcel.getSignerAddress({ networkId: parcel.unsigned.networkId }).value,
            timestamp: block.timestamp,
            isRetracted: false,
            blockHash: parcel.blockHash && parcel.blockHash.value,
            blockNumber: parcel.blockNumber,
            parcelIndex: parcel.parcelIndex
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return parcelInstance;
}

export async function getByHash(hash: H256): Promise<ParcelInstance | null> {
    try {
        return await models.Parcel.find({
            where: {
                hash: hash.value
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
