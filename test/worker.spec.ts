import models from "../src/models";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.runExample("import-test-account");
    await Helper.runExample("send-signed-parcel");
    done();
});

afterAll(async done => {
    await models.sequelize.close();
    done();
});

test("Sync test", async done => {
    const beforeLatestBlockInst = await BlockModel.getLatestBlock();

    await Helper.worker.sync();

    const paymentBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    const paymentBlock = await Helper.sdk.rpc.chain.getBlock(
        paymentBlockNumber
    );
    const afterLatestBlockInst = await BlockModel.getLatestBlock();

    expect(afterLatestBlockInst).toBeTruthy();
    const afterLatestBlockDoc = afterLatestBlockInst!.get();
    if (beforeLatestBlockInst) {
        const beforeLatestBlockDoc = beforeLatestBlockInst!.get();
        expect(beforeLatestBlockDoc.hash).not.toEqual(afterLatestBlockDoc.hash);
    }
    expect(afterLatestBlockDoc.hash).toEqual(paymentBlock!.hash.value);
    done();
});
