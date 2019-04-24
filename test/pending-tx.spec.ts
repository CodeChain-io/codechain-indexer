import { expect } from "chai";
import { H256 } from "codechain-sdk/lib/core/classes";
import "mocha";
import * as TxModel from "../src/models/logic/transaction";
import * as Helper from "./helper";

describe("pending-tx", function() {
    let p: Promise<any> | null = null;

    before(async function() {
        await Helper.runExample("import-test-account");
    });

    after(async function() {
        await Helper.sdk.rpc.devel.startSealing();
        if (p !== null) {
            await p;
        }
    });

    it("Check pending transactions", async function() {
        await Helper.sdk.rpc.devel.stopSealing();
        let pendingTx;
        try {
            p = Helper.runExample("send-signed-tx");
            await waitForSecond(2);
            await Helper.worker.sync();

            const pendingTransactionsInst = await TxModel.getPendingTransactions(
                {
                    page: 1,
                    itemsPerPage: 15
                }
            );
            expect(pendingTransactionsInst.length).equal(1);

            pendingTx = await pendingTransactionsInst![0]!.get();
            expect(pendingTx.isPending).be.true;
        } finally {
            await Helper.sdk.rpc.devel.startSealing();
        }

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
        expect(newPendingTransactions.length).equal(0);

        const indexedTransactionInst = await TxModel.getByHash(
            new H256(pendingTx.hash)
        );
        expect(indexedTransactionInst).not.null;
        const indexedTransaction = indexedTransactionInst!.get();
        expect(indexedTransaction.isPending).be.false;
    });
});

function waitForSecond(second: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, second * 1000);
    });
}
