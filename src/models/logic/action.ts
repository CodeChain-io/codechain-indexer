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

export async function createAction(
    parcelHash: H256,
    action: Action,
    options: { invoice: boolean | null; errorType: string | null }
): Promise<ActionInstance> {
    let actionInstance: ActionInstance;
    try {
        if (action instanceof Payment) {
            const actionString = action.toJSON();
            actionInstance = await models.Action.create({
                action: "payment",
                amount: actionString.amount.toString(),
                receiver: actionString.receiver,
                parcelHash: parcelHash.value,
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else if (action instanceof AssetTransaction) {
            actionInstance = await models.Action.create({
                action: "assetTransaction",
                parcelHash: parcelHash.value,
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else if (action instanceof SetRegularKey) {
            actionInstance = await models.Action.create({
                action: "setRegularKey",
                parcelHash: parcelHash.value,
                key: action.key.value,
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else if (action instanceof CreateShard) {
            actionInstance = await models.Action.create({
                action: "createShard",
                parcelHash: parcelHash.value,
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else if (action instanceof SetShardOwners) {
            actionInstance = await models.Action.create({
                action: "setShardOwners",
                parcelHash: parcelHash.value,
                shardId: action.shardId,
                owners: action.owners.map(owner => owner.value),
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else if (action instanceof SetShardUsers) {
            actionInstance = await models.Action.create({
                action: "setShardUsers",
                parcelHash: parcelHash.value,
                shardId: action.shardId,
                users: action.users.map(user => user.value),
                invoice: options.invoice,
                errorType: options.errorType
            });
        } else {
            throw Exception.InvalidAction;
        }
    } catch (err) {
        console.error(err);
        if (err.code === 105) {
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
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
