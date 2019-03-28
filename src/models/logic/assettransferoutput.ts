import * as Exception from "../../exception";
import {
    AssetTransferOutputAttribute,
    AssetTransferOutputInstance
} from "../assettransferoutput";
import models from "../index";
import { strip0xPrefix } from "./utils/format";

export async function createAssetTransferOutputs(
    outputs: AssetTransferOutputAttribute[]
): Promise<AssetTransferOutputInstance[]> {
    try {
        return models.AssetTransferOutput.bulkCreate(outputs);
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getOutputOwner(
    tracker: string,
    index: number
): Promise<{
    owner?: string | null;
    lockScriptHash?: string;
    parameters?: string[];
}> {
    try {
        return models.AssetTransferOutput.findOne({
            where: {
                transactionTracker: strip0xPrefix(tracker),
                index
            }
        }).then(instance => {
            if (instance) {
                const { owner, lockScriptHash, parameters } = instance.get({
                    plain: true
                });
                return { owner, lockScriptHash, parameters };
            }
            return {};
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

// This is for the cascade test
export async function getByTransactionHash(
    transactionHash: string
): Promise<AssetTransferOutputInstance[]> {
    try {
        return await models.AssetTransferOutput.findAll({
            where: {
                transactionHash: strip0xPrefix(transactionHash)
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
