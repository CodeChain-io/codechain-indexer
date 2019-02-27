import { Block, U64 } from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as BlockModel from "../src/models/logic/block";
import * as TransactionModel from "../src/models/logic/transaction";
import * as UTXOModel from "../src/models/logic/utxo";
import * as Helper from "./helper";

let bestBlockNumber: number;
let wrapBlock: Block;
let unwrapBlock: Block;

beforeAll(async done => {
    await Helper.runExample("import-test-account");
    await Helper.runExample("wrap-ccc-and-unwrap-ccc");
    bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    wrapBlock = (await Helper.sdk.rpc.chain.getBlock(bestBlockNumber - 1))!;
    unwrapBlock = (await Helper.sdk.rpc.chain.getBlock(bestBlockNumber))!;
    done();
});

async function check(blockResponse: Block, type: string) {
    expect(blockResponse).toBeTruthy();

    const blockInst = await BlockModel.createBlock(blockResponse, Helper.sdk, {
        miningReward: new U64("1000"),
        results: [{ success: true }]
    });
    const blockDoc = blockInst.get({ plain: true });
    expect(blockDoc.hash).toEqual(blockResponse.hash.value);

    const signed = blockResponse.transactions[0];
    expect(signed).toBeTruthy();
    const txByHashInst = (await TransactionModel.getByHash(signed.hash()))!;
    expect(txByHashInst).toBeTruthy();
    const tx = txByHashInst.get({ plain: true });
    expect(tx.hash).toEqual(signed.hash().value);
    expect(tx.type).toEqual(type);
    expect(tx.tracker).toEqual((signed.unsigned as any).tracker().value);
}

test("wrap", async done => {
    await check(wrapBlock, "wrapCCC");

    done();
});

test("unwrap", async done => {
    await check(unwrapBlock, "unwrapCCC");

    done();
});

test("Check duplicated block", async done => {
    expect(unwrapBlock).toBeTruthy();

    // Duplicated error test
    try {
        await BlockModel.createBlock(unwrapBlock, Helper.sdk, {
            miningReward: new U64("1000"),
            results: [{ success: true }]
        });
        done.fail();
    } catch (e) {
        expect(e).toBeTruthy();
        expect(e.message).toEqual("AlreadyExist");

        done();
    }
});

test("Check utxo", async done => {
    const wrapHash = wrapBlock.transactions[0].hash();
    const txInst = (await TransactionModel.getByHash(wrapHash))!;

    expect(await txInst.get("type")).toEqual("wrapCCC");
    const wcccOwner = (await txInst.getWrapCCC())!.get("recipient");

    const utxoOfWcccOwner = await UTXOModel.getByAddress(wcccOwner);
    expect(utxoOfWcccOwner.length).toEqual(0);

    const utxoOfWcccInst = await UTXOModel.getByTxHashIndex(wrapHash, 0);
    expect(utxoOfWcccInst!.get("usedTransactionHash")).toBeTruthy();

    done();
});

afterAll(async done => {
    await models.sequelize.close();
    done();
});
