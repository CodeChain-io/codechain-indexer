import { H256, SignedParcel } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import models from "../index";
import { ParcelInstance } from "../parcel";
import * as ActionModel from "./action";
import * as TransactionModel from "./transaction";

export async function createParcel(
    parcel: SignedParcel,
    isPending: boolean,
    params?: {
        timestamp?: number | null;
        invoice?: boolean | null;
        errorType?: string | null;
    } | null
): Promise<ParcelInstance> {
    let parcelInstance: ParcelInstance;
    try {
        parcelInstance = await models.Parcel.create({
            seq: parcel.unsigned.seq!,
            fee: parcel.unsigned.fee!.value.toString(10),
            networkId: parcel.unsigned.networkId,
            sig: parcel.toJSON().sig,
            hash: parcel.hash().value,
            signer: parcel.getSignerAddress({
                networkId: parcel.unsigned.networkId
            }).value,
            timestamp: params && params.timestamp,
            blockHash: parcel.blockHash && parcel.blockHash.value,
            blockNumber: parcel.blockNumber,
            parcelIndex: parcel.parcelIndex,
            isPending
        });
        await ActionModel.createAction(
            parcel.hash(),
            parcel.unsigned.action,
            isPending,
            {
                invoice: params && params.invoice,
                errorType: params && params.errorType,
                blockNumber: parcel.blockNumber,
                parcelIndex: parcel.parcelIndex,
                timestamp: params && params.timestamp
            }
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
    return parcelInstance;
}

export async function updatePendingParcel(
    hash: H256,
    params: {
        invoice: boolean | null;
        errorType: string | null;
        timestamp: number;
        parcelIndex: number;
        blockNumber: number;
        blockHash: H256;
    }
) {
    try {
        await models.Parcel.update(
            {
                blockHash: params.blockHash.value,
                parcelIndex: params.parcelIndex,
                blockNumber: params.blockNumber,
                timestamp: params.timestamp,
                isPending: false
            },
            {
                where: {
                    hash: hash.value
                }
            }
        );
        const actionInst = await ActionModel.getByHash(hash);
        const action = actionInst!.get({ plain: true });
        await ActionModel.updatePendingAction(action.id!, params);
        if (action.action === "assetTransaction") {
            await TransactionModel.updatePendingTransaction(
                new H256(action.transaction!.hash),
                params
            );
        }
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getPendingParcels() {
    try {
        return await models.Parcel.findAll({
            where: {
                isPending: true
            },
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
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
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
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function deleteByHash(hash: H256) {
    try {
        return await models.Parcel.destroy({
            where: { hash: hash.value }
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError;
    }
}
