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
    await BlockModel.createBlock(paymentBlock!, Helper.sdk, {
        miningReward: new U64("1000"),
        results: [{ success: true }]
    });
    const lastBlockInstance = await BlockModel.getLatestBlock();
    expect(lastBlockInstance).toBeTruthy();
    expect(lastBlockInstance!.get({ plain: true }).number).toEqual(
        paymentBlock!.number
    );
    done();
});

test("Pay large amount", async done => {
    const ACCOUNT_SECRET =
        "ede1d4ccb4ec9a8bbbae9a13db3f4a7b56ea04189be86ac3a6a439d9a0a1addd";
    const ACCOUNT_ADDRESS = "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";
    const seq = await Helper.sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS);
    const tx = Helper.sdk.core.createPayTransaction({
        recipient: "tccqxv9y4cw0jwphhu65tn4605wadyd2sxu5yezqghw",
        quantity: "0x0186a0"
    });
    const hash = await Helper.sdk.rpc.chain.sendSignedTransaction(
        tx.sign({
            secret: ACCOUNT_SECRET,
            fee: 10,
            seq
        })
    );
    expect(await Helper.sdk.rpc.chain.getTransactionResult(hash, {
        timeout: 300 * 1000
    })).toEqual(true);

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
    await BlockModel.createBlock(paymentBlock!, Helper.sdk, {
        miningReward: new U64("1000"),
        results: [{ success: true }]
    });
    const lastBlockInstance = await BlockModel.getLatestBlock();
    expect(lastBlockInstance).toBeTruthy();
    expect(lastBlockInstance!.get({ plain: true }).number).toEqual(
        paymentBlock!.number
    );
    done();
});
