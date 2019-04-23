import { expect } from "chai";
import { U64 } from "codechain-sdk/lib/core/classes";
import "mocha";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

describe("db-block-interface", function() {
    before(async function() {
        await Helper.runExample("import-test-account");
        await Helper.worker.sync();
        await Helper.runExample("mint-and-transfer");
    });

    it("Check getLastBlock", async function() {
        const mintBlockNumber =
            (await Helper.sdk.rpc.chain.getBestBlockNumber()) - 1;
        const mintBlock = await Helper.sdk.rpc.chain.getBlock(mintBlockNumber);
        expect(mintBlock).not.null;
        await BlockModel.createBlock(mintBlock!, Helper.sdk, new U64("1000"));
        const lastBlockInstance = await BlockModel.getLatestBlock();
        expect(lastBlockInstance).not.null;
        expect(lastBlockInstance!.get({ plain: true }).number).equal(
            mintBlock!.number
        );
    });
});
