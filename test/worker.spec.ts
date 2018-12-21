import { Payment } from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as AccountModel from "../src/models/logic/account";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.runExample("import-test-account");
    await Helper.runExample("send-signed-parcel");
    done();
});

afterAll(async done => {
    await models.sequelize.close();
    done();
});

test(
    "Sync block test",
    async done => {
        const beforeLatestBlockInst = await BlockModel.getLatestBlock();

        await Helper.worker.sync();

        const paymentBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        const paymentBlock = await Helper.sdk.rpc.chain.getBlock(
            paymentBlockNumber
        );
        const afterLatestBlockInst = await BlockModel.getLatestBlock();

        expect(afterLatestBlockInst).toBeTruthy();
        const afterLatestBlockDoc = afterLatestBlockInst!.get();
        if (beforeLatestBlockInst) {
            const beforeLatestBlockDoc = beforeLatestBlockInst!.get();
            expect(beforeLatestBlockDoc.hash).not.toEqual(
                afterLatestBlockDoc.hash
            );
        }
        expect(afterLatestBlockDoc.hash).toEqual(paymentBlock!.hash.value);
        done();
    },
    1000 * 20
);

test(
    "Sync account test",
    async done => {
        const genesisAccounts: string[] = await Helper.sdk.rpc.sendRpcRequest(
            "chain_getGenesisAccounts",
            []
        );

        if (genesisAccounts.length > 0) {
            const accountInst = await AccountModel.getByAddress(
                genesisAccounts[0]
            );
            expect(accountInst).toBeTruthy();
        }

        const paymentBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        const paymentBlock = await Helper.sdk.rpc.chain.getBlock(
            paymentBlockNumber
        );
        const receiver = (paymentBlock!.parcels[0]!.unsigned.action as Payment)
            .receiver.value;
        const receiverInst = await AccountModel.getByAddress(receiver);
        const receiverBalance = receiverInst!.get();
        await Helper.runExample("send-signed-parcel");
        await Helper.worker.sync();
        const newReceiverInst = await AccountModel.getByAddress(receiver);
        const newReceiverBalance = newReceiverInst!.get();
        expect(newReceiverBalance.balance).not.toEqual(receiverBalance.balance);

        done();
    },
    1000 * 20
);

test("Sync UTXO test", async done => {
    // TODO
    done();
});
