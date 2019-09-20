import { expect } from "chai";
import "mocha";
import * as moment from "moment";
import { LogType } from "../src/models/log";
import * as LogModel from "../src/models/logic/log";
import * as Helper from "./helper";

let blockLogCount = 0;
let txLogCount = 0;

describe("log", function() {
    before(async function() {
        await Helper.resetDb();
        const date = moment()
            .utc()
            .format("YYYY-MM-DD");

        await Helper.worker.sync();

        const blockLogInst = await LogModel.getLog(date, LogType.BLOCK_COUNT);
        if (blockLogInst) {
            blockLogCount = blockLogInst!.get().count;
        }
        const txLogInst = await LogModel.getLog(date, LogType.TX_COUNT);
        if (txLogInst) {
            txLogCount = txLogInst!.get().count;
        }

        await Helper.runExample("mint-and-transfer");

        await Helper.worker.sync();
    });

    it("Check log block count", async function() {
        const date = moment()
            .utc()
            .format("YYYY-MM-DD");
        const nextLogInst = await LogModel.getLog(date, LogType.BLOCK_COUNT);
        expect(nextLogInst).not.null;
        expect(nextLogInst!.get().count).equal(blockLogCount + 2);
    });

    it.skip("Check log block miner", function() {
        // TODO
    });

    it.skip("Check log pay count", function() {
        // TODO
    });

    it.skip("Check log setRegularKey count", function() {
        // TODO
    });

    it.skip("Check log createShard count", function() {
        // TODO
    });

    it.skip("Check log setShardUsers count", function() {
        // TODO
    });

    it.skip("Check log setShardOwners count", function() {
        // TODO
    });

    it.skip("Check log assetTransaciton count", function() {
        // TODO
    });

    it("Check log transaction count", async function() {
        const date = moment()
            .utc()
            .format("YYYY-MM-DD");
        const nextLogInst = await LogModel.getLog(date, LogType.TX_COUNT);
        expect(nextLogInst).not.null;
        expect(nextLogInst!.get().count).equal(txLogCount + 2);
    });

    it.skip("Check log mint transaction count", function() {
        // TODO
    });

    it.skip("Check log transfer transaction count", function() {
        // TODO
    });

    it.skip("Check log change assetScheme transaction count", function() {
        // TODO
    });

    it.skip("Check log store transaction count", function() {
        // TODO
    });

    it.skip("Check log remove transaction count", function() {
        // TODO
    });

    it.skip("Check log custom transaction count", function() {
        // TODO
    });

    it.skip("Check log wrapCCC transaction count", function() {
        // TODO
    });

    it.skip("Check log unwrapCCC transaction count", function() {
        // TODO
    });
});
