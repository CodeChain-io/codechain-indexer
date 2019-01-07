import {
    Block,
    H256,
    MintAsset
} from "codechain-sdk/lib/core/classes";
import * as moment from "moment";
import models from "../src/models";
import * as SnapshotModel from "../src/models/logic/snapshot";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.runExample("import-test-account");
    await Helper.runExample("mint-and-transfer");
    done();
});

afterAll(async done => {
    await models.sequelize.close();
    done();
});

let mintBlock: Block;
let assetType: H256;
let snapshotId: string;
test("Register snapshot", async done => {
    const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    const mintBlockNumber = bestBlockNumber - 1;
    const mintBlockResponse = await Helper.sdk.rpc.chain.getBlock(
        mintBlockNumber
    );
    mintBlock = mintBlockResponse!;

    const assetMintTransaction = (mintBlock.transactions[0].unsigned as MintAsset);

    assetType = assetMintTransaction.getAssetSchemeAddress();

    const beforeSnapshotRequestsInst = await SnapshotModel.getSnapshotRequests();
    const snapshotInst = await SnapshotModel.createSnapshotRequests(
        assetType,
        moment()
            .subtract(60, "seconds")
            .unix()
    );
    expect(snapshotInst).toBeTruthy();
    snapshotId = snapshotInst!.get().id!;
    const snapshotRequestsInst = await SnapshotModel.getSnapshotRequests();
    expect(snapshotRequestsInst.length).toEqual(
        beforeSnapshotRequestsInst.length + 1
    );
    done();
});

test("Check snapshot working", async done => {
    await Helper.worker.sync();
    const snapshotRequestsInst = await SnapshotModel.getSnapshotRequests();
    expect(snapshotRequestsInst.length).toEqual(0);
    const UTXOSnapshotInst = await SnapshotModel.getUTXOSnapshotBySnapshotId(
        snapshotId
    );
    const UTXOSnapshot = UTXOSnapshotInst!.get().snapshot;
    expect(UTXOSnapshot.length).not.toEqual(0);
    done();
});
