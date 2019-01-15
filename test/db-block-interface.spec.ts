import { U64 } from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.setupDb();
    await Helper.runExample("import-test-account");
    await Helper.runExample("mint-and-transfer");
    done();
});

afterAll(async done => {
    await models.sequelize.close();
    await Helper.dropDb();
    done();
});

test("Check getLastBlock", async done => {
    const mintBlockNumber =
        (await Helper.sdk.rpc.chain.getBestBlockNumber()) - 1;
    const mintBlock = await Helper.sdk.rpc.chain.getBlock(mintBlockNumber);
    expect(mintBlock).toBeTruthy();
    await BlockModel.createBlock(mintBlock!, {
        miningReward: new U64("1000"),
        invoices: [{invoice: true}]
    });
    const lastBlockInstance = await BlockModel.getLatestBlock();
    expect(lastBlockInstance).toBeTruthy();
    expect(lastBlockInstance!.get({ plain: true }).number).toEqual(
        mintBlock!.number
    );

    done();
});
