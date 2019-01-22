import { H256 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import { WorkerContext } from ".";
import { BlockAttribute } from "../models/block";
import * as SnapshotModel from "../models/logic/snapshot";
import * as UTXOModel from "../models/logic/utxo";

export async function updateSnapshot(block: BlockAttribute, _C: WorkerContext) {
    const snapshotRequestsInst = await SnapshotModel.getSnapshotRequests();
    const currentSnapshots = _.filter(snapshotRequestsInst, r => {
        return r.get("timestamp") < block.timestamp;
    });
    if (currentSnapshots.length === 0) {
        return;
    }
    for (const snapshotRequest of currentSnapshots) {
        const request = snapshotRequest.get();
        const UTXOInsts = await UTXOModel.getByAssetType(
            new H256(request.assetType)
        );
        const UTXOAttributes = UTXOInsts.map(utxoInst => utxoInst.get());
        await SnapshotModel.indexUTXOSnapshot(
            request.id!,
            UTXOAttributes,
            block.number
        );
        await SnapshotModel.updateSnapshotRequest(request.id!, "done");
    }
}
