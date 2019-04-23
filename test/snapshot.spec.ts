import { expect } from "chai";
import { H256 } from "codechain-primitives/lib";
import { Block, MintAsset } from "codechain-sdk/lib/core/classes";
import "mocha";
import * as BlockModel from "../src/models/logic/block";
import * as UTXOModel from "../src/models/logic/utxo";
import * as Helper from "./helper";

describe("snapshot", function() {
    let mintBlock: Block;
    let transferBlock: Block;
    let assetType: H256;

    beforeEach(async function() {
        this.timeout("30s");

        // Sync the genesis block.
        await Helper.resetDb();
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
    });

    it("Get an empty snapshot", async function() {
        const snapshot = await UTXOModel.getSnapshot(
            assetType,
            mintBlock.number
        );
        expect(snapshot.length).equal(0);
    });

    it("Sync", async function() {
        const prevBlockCount = await BlockModel.getNumberOfBlocks({});
        await Helper.worker.sync();
        const blockCount = await BlockModel.getNumberOfBlocks({});
        expect(blockCount).equal(prevBlockCount + 2);
    });

    it("Fail to get the transfer block by timestamp", async function() {
        const block = await BlockModel.getByTime(transferBlock.timestamp);
        expect(block).be.null;
    });
});

describe("snapshot synchronized", function() {
    let mintBlock: Block;
    let transferBlock: Block;
    let assetType: H256;

    before(async function() {
        this.timeout("30s");

        // Sync the genesis block.
        await Helper.resetDb();
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
        await Helper.worker.sync();
    });

    it("Get the mint snapshot", async function() {
        const snapshot = await UTXOModel.getSnapshot(
            assetType,
            mintBlock.number
        );
        expect(snapshot.length).equal(1);
    });

    it("Add another block", async function() {
        const prevBlockCount = await BlockModel.getNumberOfBlocks({});
        await Helper.runExample("send-signed-tx");
        await Helper.worker.sync();
        const blockCount = await BlockModel.getNumberOfBlocks({});
        expect(blockCount).equal(prevBlockCount + 1);
    });

    it("Get the transfer block by timestamp", async function() {
        const block = await BlockModel.getByTime(transferBlock.timestamp);
        expect(block).not.null;
    });

    it("Get the transfer snapshot", async function() {
        const snapshot = await UTXOModel.getSnapshot(
            assetType,
            transferBlock.number
        );
        expect(snapshot.length).equal(2);
    });
});
