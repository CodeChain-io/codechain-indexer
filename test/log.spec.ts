import * as moment from "moment";
import models from "../src/models";
import { LogType } from "../src/models/log";
import * as LogModel from "../src/models/logic/log";
import * as Helper from "./helper";

let date: string;
let blockLogCount = 0;
let txLogCount = 0;
beforeAll(async done => {
    await Helper.worker.sync();
    await Helper.runExample("import-test-account");
    await Helper.runExample("mint-and-transfer");

    date = moment().format("YYYY-MM-DD");
    const blockLogInst = await LogModel.getLog(date, LogType.BLOCK_COUNT);
    if (blockLogInst) {
        blockLogCount = blockLogInst!.get().count;
    }
    const txLogInst = await LogModel.getLog(date, LogType.TX_COUNT);
    if (txLogInst) {
        txLogCount = txLogInst!.get().count;
    }

    await Helper.worker.sync();
    done();
});

afterAll(async done => {
    await models.sequelize.close();
    done();
});

test("Check log block count", async done => {
    const nextLogInst = await LogModel.getLog(date, LogType.BLOCK_COUNT);
    expect(nextLogInst).toBeTruthy();
    expect(nextLogInst!.get().count).toEqual(blockLogCount + 2);

    done();
});

test("Check log block miner", async done => {
    // TODO
    done();
});

test("Check log pay count", async done => {
    // TODO
    done();
});

test("Check log setRegularKey count", async done => {
    // TODO
    done();
});

test("Check log createShard count", async done => {
    // TODO
    done();
});

test("Check log setShardUsers count", async done => {
    // TODO
    done();
});

test("Check log setShardOwners count", async done => {
    // TODO
    done();
});

test("Check log assetTransaciton count", async done => {
    // TODO
    done();
});

test("Check log transaction count", async done => {
    const nextLogInst = await LogModel.getLog(date, LogType.TX_COUNT);
    expect(nextLogInst).toBeTruthy();
    expect(nextLogInst!.get().count).toEqual(txLogCount + 4);

    done();
});

test("Check log mint transaction count", async done => {
    // TODO
    done();
});

test("Check log transfer transaction count", async done => {
    // TODO
    done();
});

test("Check log compose transaction count", async done => {
    // TODO
    done();
});

test("Check log decompose transaction count", async done => {
    // TODO
    done();
});
