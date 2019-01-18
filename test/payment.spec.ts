import { U64 } from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.runExample("import-test-account");
    await Helper.runExample("send-signed-tx");
    done();
});

afterAll(async done => {
    await models.sequelize.close();
    done();
});

test("Create payment block", async done => {
    const paymentBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    const paymentBlock = await Helper.sdk.rpc.chain.getBlock(
        paymentBlockNumber
    );
    expect(paymentBlock).toBeTruthy();
    const miningRewardResponse = await Helper.sdk.rpc.sendRpcRequest(
        "chain_getMiningReward",
        [paymentBlockNumber]
    );

    expect(miningRewardResponse).toBeTruthy();
    await BlockModel.createBlock(paymentBlock!, {
        miningReward: new U64("1000"),
        invoices: [{ invoice: true}]
    });
    const lastBlockInstance = await BlockModel.getLatestBlock();
    expect(lastBlockInstance).toBeTruthy();
    expect(lastBlockInstance!.get({ plain: true }).number).toEqual(
        paymentBlock!.number
    );
    done();
});
