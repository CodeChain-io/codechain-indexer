import {
    MintAsset
} from "codechain-sdk/lib/core/classes";
import * as moment from "moment";
import models from "../src/models";
import * as SnapshotModel from "../src/models/logic/snapshot";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.runExample("send-signed-tx");
    await Helper.runExample("import-test-account");
    await Helper.runExample("mint-and-transfer");
    await Helper.worker.sync();
    done();
}, 30_000);

afterAll(async done => {
    await models.sequelize.close();
    done();
});

test("Register snapshot", async done => {
    const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    const mintBlockNumber = bestBlockNumber - 1;
    const mintBlock = (await Helper.sdk.rpc.chain.getBlock(
        mintBlockNumber
    ))!;

    const assetMintTransaction = (mintBlock.transactions[0].unsigned as MintAsset);

    const assetType = assetMintTransaction.getAssetSchemeAddress();

    const beforeSnapshotRequestsInst = await SnapshotModel.getSnapshotRequests();
    const snapshotInst = await SnapshotModel.createSnapshotRequests(
        assetType,
        moment()
            .utc()
            .subtract(60, "seconds")
            .unix()
    );
    expect(snapshotInst).toBeTruthy();
    const snapshotId = snapshotInst!.get("id");
    const snapshotRequestsInst = await SnapshotModel.getSnapshotRequests();
    expect(snapshotRequestsInst.length).toEqual(
        beforeSnapshotRequestsInst.length + 1
    );

    await Helper.runExample("mint-and-transfer");
    await Helper.worker.sync();

    const UTXOSnapshotInst = await SnapshotModel.getUTXOSnapshotBySnapshotId(
        snapshotId
    );
    const UTXOSnapshot = UTXOSnapshotInst!.get("snapshot");
    expect(UTXOSnapshot.length).not.toEqual(0);

    done();
}, 30_000);
