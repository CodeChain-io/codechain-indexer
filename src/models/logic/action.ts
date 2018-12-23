import {
    Action,
    AssetTransaction,
    CreateShard,
    H256,
    Payment,
    SetRegularKey,
    SetShardOwners,
    SetShardUsers
} from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { ActionInstance } from "../action";
import models from "../index";
import * as TransactionModel from "./transaction";

export async function createAction(
    parcelHash: H256,
    action: Action,
    params: {
        invoice: boolean | null;
        errorType: string | null;
        blockNumber: number;
        parcelIndex: number;
        parcelHash: H256;
        timestamp: number;
    }
): Promise<ActionInstance> {
    let actionInstance: ActionInstance;
    try {
        if (action instanceof Payment) {
            actionInstance = await models.Action.create({
                action: "payment",
                amount: action.amount.value.toString(10),
                receiver: action.receiver.value,
                parcelHash: parcelHash.value,
                invoice: params.invoice,
                errorType: params.errorType
            });
        } else if (action instanceof AssetTransaction) {
            actionInstance = await models.Action.create({
                action: "assetTransaction",
                parcelHash: parcelHash.value,
                approvals: action.approvals,
                invoice: params.invoice,
                errorType: params.errorType
            });
            const id = actionInstance.get({ plain: true }).id!;
            await TransactionModel.createTransaction(
                id,
                action.transaction,
                params
            );
        } else if (action instanceof SetRegularKey) {
            actionInstance = await models.Action.create({
                action: "setRegularKey",
                parcelHash: parcelHash.value,
                key: action.key.value,
                invoice: params.invoice,
                errorType: params.errorType
            });
        } else if (action instanceof CreateShard) {
            actionInstance = await models.Action.create({
                action: "createShard",
                parcelHash: parcelHash.value,
                invoice: params.invoice,
                errorType: params.errorType
            });
        } else if (action instanceof SetShardOwners) {
            actionInstance = await models.Action.create({
                action: "setShardOwners",
                parcelHash: parcelHash.value,
                shardId: action.shardId,
                owners: action.owners.map(owner => owner.value),
                invoice: params.invoice,
                errorType: params.errorType
            });
        } else if (action instanceof SetShardUsers) {
            actionInstance = await models.Action.create({
                action: "setShardUsers",
                parcelHash: parcelHash.value,
                shardId: action.shardId,
                users: action.users.map(user => user.value),
                invoice: params.invoice,
                errorType: params.errorType
            });
        } else {
            throw Exception.InvalidAction;
        }
    } catch (err) {
        console.error(err);
        if (err.code === Exception.InvalidAction.code) {
            throw err;
        }
        throw Exception.DBError;
    }
    return actionInstance;
}

// This is for the cascade test
export async function getByHash(hash: H256): Promise<ActionInstance | null> {
    try {
        return await models.Action.findOne({
            where: {
                parcelHash: hash.value
            },
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
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
