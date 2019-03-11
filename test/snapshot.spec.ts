import { H256 } from "codechain-primitives/lib";
import { Block, MintAsset } from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as BlockModel from "../src/models/logic/block";
import * as UTXOModel from "../src/models/logic/utxo";
import * as Helper from "./helper";

let mintBlock: Block;
let transferBlock: Block;
let assetType: H256;

beforeAll(async done => {
    // Sync the genesis block.
    await Helper.worker.sync();
    await Helper.runExample("import-test-account");
    await Helper.runExample("mint-and-transfer");
    const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    const mintBlockNumber = bestBlockNumber - 1;
    mintBlock = (await Helper.sdk.rpc.chain.getBlock(mintBlockNumber))!;
    const assetMintTransaction = mintBlock.transactions[0]
        .unsigned as MintAsset;
    assetType = assetMintTransaction.getAssetType();
    transferBlock = (await Helper.sdk.rpc.chain.getBlock(bestBlockNumber))!;
    done();
}, 30_000);

afterAll(async done => {
    await models.sequelize.close();
    done();
});

test("Get an empty snapshot", async done => {
    const snapshot = await UTXOModel.getSnapshot(assetType, mintBlock.number);
    expect(snapshot).toHaveLength(0);
    done();
});

test("Sync", async done => {
    const prevBlockCount = await BlockModel.getNumberOfBlocks({});
    await Helper.worker.sync();
    const blockCount = await BlockModel.getNumberOfBlocks({});
    expect(blockCount).toBe(prevBlockCount + 2);
    done();
});

test("Get the mint snapshot", async done => {
    const snapshot = await UTXOModel.getSnapshot(assetType, mintBlock.number);
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].blockNumber).toBe(mintBlock.number);
    expect(snapshot[0].transactionHash).toBe(
        mintBlock.transactions[0].hash().value
    );
    expect(snapshot[0].usedBlockNumber).toBeNull();
    expect(snapshot[0].usedTransactionHash).toBeNull();
    done();
});

test("Fail to get the transfer block by timestamp", async done => {
    const block = await BlockModel.getByTime(transferBlock.timestamp);
    expect(block).toBeNull();
    done();
});

test("Add another block", async done => {
    const prevBlockCount = await BlockModel.getNumberOfBlocks({});
    await Helper.runExample("send-signed-tx");
    await Helper.worker.sync();
    const blockCount = await BlockModel.getNumberOfBlocks({});
    expect(blockCount).toBe(prevBlockCount + 1);
    done();
});

test("Get the transfer block by timestamp", async done => {
    const block = await BlockModel.getByTime(transferBlock.timestamp);
    expect(block).toBeTruthy();
    done();
});

test("Get the transfer snapshot", async done => {
    const snapshot = await UTXOModel.getSnapshot(
        assetType,
        transferBlock.number
    );
    expect(snapshot).toHaveLength(2);

    for (const utxo of snapshot) {
        expect(utxo.blockNumber).toBe(transferBlock.number);
        expect(utxo.transactionHash).toBe(
            transferBlock.transactions[0].hash().value
        );
        expect(utxo.usedBlockNumber).toBeNull();
        expect(utxo.usedTransactionHash).toBeNull();
    }

    expect(
        new Set([
            snapshot[0].transactionOutputIndex,
            snapshot[1].transactionOutputIndex
        ])
    ).toEqual(new Set([0, 1]));

    done();
});
