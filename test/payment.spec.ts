import { expect } from "chai";
import { U64 } from "codechain-sdk/lib/core/classes";
import "mocha";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

describe("payment", function() {
    before(async function() {
        await Helper.resetDb();
        await Helper.runExample("import-test-account");
    });

    it("Create payment block", async function() {
        await Helper.worker.sync();
        await Helper.runExample("send-signed-tx");
        const paymentBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        const paymentBlock = await Helper.sdk.rpc.chain.getBlock(
            paymentBlockNumber
        );
        expect(paymentBlock).not.null;
        const miningRewardResponse = await Helper.sdk.rpc.sendRpcRequest(
            "chain_getMiningReward",
            [paymentBlockNumber]
        );

        expect(miningRewardResponse).not.null;
        await BlockModel.createBlock(
            paymentBlock!,
            Helper.sdk,
            new U64("1000")
        );
        const lastBlockInstance = await BlockModel.getLatestBlock();
        expect(lastBlockInstance).not.null;
        expect(lastBlockInstance!.get({ plain: true }).number).equal(
            paymentBlock!.number
        );
    });

    it("Pay large amount", async function() {
        await Helper.worker.sync();
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

        for (let i = 0; i < 1000; i += 1) {
            if (await Helper.sdk.rpc.chain.containsTransaction(hash)) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        expect(await Helper.sdk.rpc.chain.containsTransaction(hash)).be.true;

        const paymentBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        const paymentBlock = await Helper.sdk.rpc.chain.getBlock(
            paymentBlockNumber
        );
        expect(paymentBlock).not.null;
        const miningRewardResponse = await Helper.sdk.rpc.sendRpcRequest(
            "chain_getMiningReward",
            [paymentBlockNumber]
        );

        expect(miningRewardResponse).not.null;
        await BlockModel.createBlock(
            paymentBlock!,
            Helper.sdk,
            new U64("1000")
        );
        const lastBlockInstance = await BlockModel.getLatestBlock();
        expect(lastBlockInstance).not.null;
        expect(lastBlockInstance!.get({ plain: true }).number).equal(
            paymentBlock!.number
        );
    });
});
