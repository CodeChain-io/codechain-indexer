import { AssetTransferOutput } from "codechain-sdk/lib/core/classes";
import { Transaction } from "sequelize";
import * as Exception from "../../exception";
import { AssetTransferOutputInstance } from "../assettransferoutput";
import models from "../index";
import * as AddressUtil from "./utils/address";
import { strip0xPrefix } from "./utils/format";

export async function createAssetTransferOutput(
    transactionHash: string,
    transactionTracker: string,
    output: AssetTransferOutput,
    index: number,
    params: {
        networkId: string;
    },
    options: {
        transaction?: Transaction;
    } = {}
): Promise<AssetTransferOutputInstance> {
    let assetTransferOuputInstance: AssetTransferOutputInstance;
    try {
        const parameters = output.parameters.map(p => p.toString("hex"));
        const owner = AddressUtil.getOwner(
            output.lockScriptHash,
            parameters,
            params.networkId
        );
        assetTransferOuputInstance = await models.AssetTransferOutput.create(
            {
                transactionHash: strip0xPrefix(transactionHash),
                transactionTracker: strip0xPrefix(transactionTracker),
                lockScriptHash: strip0xPrefix(output.lockScriptHash.value),
                parameters: parameters.map(p => strip0xPrefix(p)),
                assetType: strip0xPrefix(output.assetType.value),
                shardId: output.shardId,
                quantity: output.quantity.value.toString(10),
                index,
                owner
            },
            { transaction: options.transaction }
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
    return assetTransferOuputInstance;
}

export async function getOutputOwner(
    tracker: string,
    index: number,
    options: {
        transaction?: Transaction;
    } = {}
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
            },
            transaction: options.transaction
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
