import { Remove, Store, U64 } from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as ActionModel from "../src/models/logic/action";
import { createBlock } from "../src/models/logic/block";
import * as TransactionModel from "../src/models/logic/transaction";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.setupDb();
    await Helper.runExample("import-test-account");
    await Helper.runExample("store-and-remove");

    done();
});

async function check(blockNumber: number, typeName: string, typeInstance: any) {
    const blockResponse = (await Helper.sdk.rpc.chain.getBlock(
        blockNumber
    ))!;

    expect(blockResponse).toBeTruthy();
    expect(blockResponse.transactions.length).toBe(1);

    const blockInst = await createBlock(blockResponse, {
        miningReward: new U64("1000"),
        invoices: [{ invoice: true}]
    });

    const blockDoc = blockInst.get({ plain: true });
    expect(blockDoc.hash).toEqual(blockResponse.hash.value);

    const signed = blockResponse.transactions[0]!;
    const unsigned = signed.unsigned;
    expect(unsigned).toBeInstanceOf(typeInstance);

    const actionInst = (await ActionModel.getByHash(signed.hash()))!;
    expect(actionInst).toBeTruthy();
    const action = actionInst.get({ plain: true });
    expect(action.type).toEqual(typeName);
    expect(action.id).toBeTruthy();

    const txInst = (await TransactionModel.getByHash(
        signed.hash()
    ))!;
    expect(txInst).toBeTruthy();
    const tx = txInst.get({ plain: true });
    expect(tx.hash).toEqual(signed.hash().value);
}

test("store", async done => {
    const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    await check(bestBlockNumber - 1, "store", Store);
    done();
});

test("remove", async done => {
    const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    await check(bestBlockNumber, "remove", Remove);

    done()
});

afterAll(async done => {
    await models.sequelize.close();
    await Helper.dropDb();
    done();
});
