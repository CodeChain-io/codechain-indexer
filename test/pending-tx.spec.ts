import { H256 } from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as TxModel from "../src/models/logic/transaction";
import * as Helper from "./helper";

let p: Promise<any> | null = null;
beforeAll(async done => {
    await Helper.runExample("import-test-account");
    done();
});

afterAll(async done => {
    await Helper.sdk.rpc.devel.startSealing();
    if (p !== null) {
        await p;
    }
    await models.sequelize.close();
    done();
});

test("Check pending transactions", async done => {
    await Helper.sdk.rpc.devel.stopSealing();
    p = Helper.runExample("send-signed-tx");
    await waitForSecond(2);
    await Helper.worker.sync();

    const pendingTransactionsInst = await TxModel.getPendingTransactions({
        page: 1,
        itemsPerPage: 15
    });
    expect(pendingTransactionsInst.length).toEqual(1);

    const pendingTx = await pendingTransactionsInst![0]!.get();
    expect(pendingTx.isPending).toEqual(true);

    await Helper.sdk.rpc.devel.startSealing();
    while (
        (await Helper.sdk.rpc.chain.getPendingTransactions()).transactions
            .length !== 0
    ) {
        await waitForSecond(1);
        console.log("waiting ...");
    }
    await Helper.worker.sync();

    const newPendingTransactions = await TxModel.getPendingTransactions({
        page: 1,
        itemsPerPage: 15
    });
    expect(newPendingTransactions.length).toEqual(0);

    const indexedTransactionInst = await TxModel.getByHash(
        new H256(pendingTx.hash)
    );
    expect(indexedTransactionInst).toBeTruthy();
    const indexedTransaction = indexedTransactionInst!.get();
    expect(indexedTransaction.isPending).toEqual(false);

    done();
}, 25000);

function waitForSecond(second: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, second * 1000);
    });
}
