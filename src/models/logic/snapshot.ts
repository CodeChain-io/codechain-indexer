import { H256 } from "codechain-sdk/lib/core/classes";
import models from "..";
import * as Exception from "../../exception";
import { UTXOAttribute } from "../utxo";

export async function createSnapshotRequests(
    assetType: H256,
    timestamp: number
) {
    try {
        return await models.SnapshotRequest.create({
            timestamp,
            assetType: assetType.value,
            status: "wait"
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function updateSnapshotRequest(
    snapshotId: string,
    status: "wait" | "done"
) {
    try {
        return await models.SnapshotRequest.update(
            {
                status
            },
            {
                where: {
                    id: snapshotId
                }
            }
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function indexUTXOSnapshot(
    snapshotId: string,
    snapshot: UTXOAttribute[],
    blockNumber: number
) {
    try {
        const utxoSnapshotInstance = await models.UTXOSnapshot.upsert({
            snapshotId,
            snapshot,
            blockNumber
        });
        await updateSnapshotRequest(snapshotId, "done");
        return utxoSnapshotInstance;
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getSnapshotRequests() {
    try {
        return await models.SnapshotRequest.findAll({
            where: {
                status: "wait"
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getUTXOSnapshotBySnapshotId(snapshotId: string) {
    try {
        return await models.UTXOSnapshot.findOne({
            where: {
                snapshotId
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
