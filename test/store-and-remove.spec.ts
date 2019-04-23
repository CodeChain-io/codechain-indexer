import { expect } from "chai";
import { Remove, Store, U64 } from "codechain-sdk/lib/core/classes";
import "mocha";
import { createBlock } from "../src/models/logic/block";
import * as TransactionModel from "../src/models/logic/transaction";
import * as Helper from "./helper";

async function check(blockNumber: number, typeName: string, typeInstance: any) {
    const blockResponse = (await Helper.sdk.rpc.chain.getBlock(blockNumber))!;

    expect(blockResponse).not.null;
    expect(blockResponse.transactions.length).equal(1);

    const blockInst = await createBlock(
        blockResponse,
        Helper.sdk,
        new U64("1000")
    );

    const blockDoc = blockInst.get({ plain: true });
    expect(blockDoc.hash).equal(blockResponse.hash.value);

    const signed = blockResponse.transactions[0]!;
    const unsigned = signed.unsigned;
    expect(unsigned instanceof typeInstance).be.true;

    const txInst = (await TransactionModel.getByHash(signed.hash()))!;
    expect(txInst).not.null;
    const tx = txInst.get({ plain: true });
    expect(tx.hash).equal(signed.hash().value);
    expect(tx.type).equal(typeName);
}

describe("store-and-remove", function() {
    before(async function() {
        await Helper.runExample("import-test-account");
        await Helper.runExample("store-and-remove");
    });

    it("store", async function() {
        const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        await check(bestBlockNumber - 1, "store", Store);
    });

    it("remove", async function() {
        const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        await check(bestBlockNumber, "remove", Remove);
    });
});
