import { expect } from "chai";
import { Block, U64 } from "codechain-sdk/lib/core/classes";
import "mocha";
import * as BlockModel from "../src/models/logic/block";
import * as TransactionModel from "../src/models/logic/transaction";
import * as UTXOModel from "../src/models/logic/utxo";
import * as Helper from "./helper";

async function check(blockResponse: Block, type: string) {
    expect(blockResponse).not.null;

    const blockInst = await BlockModel.createBlock(
        blockResponse,
        Helper.sdk,
        new U64("1000")
    );
    const blockDoc = blockInst.get({ plain: true });
    expect(blockDoc.hash).equal(blockResponse.hash.value);

    const signed = blockResponse.transactions[0];
    expect(signed).not.null;
    const txByHashInst = (await TransactionModel.getByHash(signed.hash()))!;
    expect(txByHashInst).not.null;
    const tx = txByHashInst.get({ plain: true });
    expect(tx.hash).equal(signed.hash().value);
    expect(tx.type).equal(type);
    expect(tx.tracker).equal((signed.unsigned as any).tracker().value);
}

describe("wrap-unwrap", function() {
    let bestBlockNumber: number;
    let wrapBlock: Block;
    let unwrapBlock: Block;

    before(async function() {
        await Helper.runExample("import-test-account");
        await Helper.runExample("wrap-ccc-and-unwrap-ccc");
        bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        wrapBlock = (await Helper.sdk.rpc.chain.getBlock(bestBlockNumber - 1))!;
        unwrapBlock = (await Helper.sdk.rpc.chain.getBlock(bestBlockNumber))!;
    });

    it("wrap", async function() {
        await check(wrapBlock, "wrapCCC");
    });

    it("unwrap", async function() {
        await check(unwrapBlock, "unwrapCCC");
    });

    it("Check duplicated block", async function() {
        expect(unwrapBlock).not.null;

        // Duplicated error test
        try {
            await BlockModel.createBlock(
                unwrapBlock,
                Helper.sdk,
                new U64("1000")
            );
            expect.fail();
        } catch (e) {
            expect(e).not.null;
            expect(e.message).equal("AlreadyExist");
        }
    });

    it("Check utxo", async function() {
        const wrapHash = wrapBlock.transactions[0].hash();
        const txInst = (await TransactionModel.getByHash(wrapHash))!;

        expect(await txInst.get("type")).equal("wrapCCC");
        const wcccOwner = (await txInst.getWrapCCC())!.get("recipient");

        const utxoOfWcccOwner = await UTXOModel.getByAddress(wcccOwner);
        expect(utxoOfWcccOwner.length).equal(0);

        const utxoOfWcccInst = await UTXOModel.getByTxHashIndex(wrapHash, 0);
        expect(utxoOfWcccInst!.get("usedTransactionHash")).not.null;
    });
});
