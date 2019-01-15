import { H256 } from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as TxModel from "../src/models/logic/transaction";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.setupDb();
    await Helper.runExample("import-test-account");
    done();
});

afterAll(async done => {
    await Helper.sdk.rpc.devel.startSealing();
    await models.sequelize.close();
    await Helper.dropDb();
    done();
});

test(
    "Check pending transactions",
    async done => {
        await Helper.sdk.rpc.devel.stopSealing();
        Helper.runExample("send-signed-tx");
        await waitForSecond(2);
        await Helper.worker.sync();

        const pendingTransactionsInst = await TxModel.getPendingTransactions({});
        expect(pendingTransactionsInst.length).toEqual(1);

        const pendingTx = await pendingTransactionsInst![0]!.get();
        expect(pendingTx.isPending).toEqual(true);

        await Helper.sdk.rpc.devel.startSealing();
        await Helper.worker.sync();

        const newPendingTransactions = await TxModel.getPendingTransactions({});
        expect(newPendingTransactions.length).toEqual(0);

        const indexedTransactionInst = await TxModel.getByHash(
            new H256(pendingTx.hash)
        );
        expect(indexedTransactionInst).toBeTruthy();
        const indexedTransaction = indexedTransactionInst!.get();
        expect(indexedTransaction.isPending).toEqual(false);

        done();
    },
    25000
);

function waitForSecond(second: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, second * 1000);
    });
}
