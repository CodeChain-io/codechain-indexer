import { Pay } from "codechain-sdk/lib/core/classes";
import * as sinon from "sinon";
import models from "../src/models";
import * as AccountModel from "../src/models/logic/account";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.resetDb();
    await Helper.runExample("import-test-account");
    await Helper.runExample("send-signed-tx");
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
            expect(beforeLatestBlockDoc.number).not.toEqual(
                afterLatestBlockDoc.number
            );
            expect(beforeLatestBlockDoc.hash).not.toEqual(
                afterLatestBlockDoc.hash
            );
        }
        expect(afterLatestBlockDoc.hash).toEqual(paymentBlock!.hash.value);
        done();
    },
    1000 * 30
);

test.skip(
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
        expect(paymentBlock!.transactions[0]!.unsigned.type()).toEqual("pay");
        // FIXME: remove any
        const receiver = ((paymentBlock!.transactions[0]!
            .unsigned as Pay) as any).receiver.value;
        const receiverInst = await AccountModel.getByAddress(receiver);
        const receiverBalance = receiverInst!.get("balance");

        await Helper.runExample("send-signed-tx");
        await Helper.worker.sync();

        const newReceiverInst = await AccountModel.getByAddress(receiver);
        const newReceiverBalance = newReceiverInst!.get();
        expect(newReceiverBalance.balance).not.toEqual(receiverBalance);

        done();
    },
    1000 * 30
);

test.skip("worker/account rpc fail", async done => {
    await Helper.worker.sync();

    const getBalanceStub = sinon.stub(
        Helper.worker.context.sdk.rpc.chain,
        "getBalance"
    );
    const getSeqStub = sinon.stub(
        Helper.worker.context.sdk.rpc.chain,
        "getSeq"
    );

    getBalanceStub.rejects(Error("ECONNREFUSED"));
    getSeqStub.rejects(Error("ECONNREFUSED"));

    const prevBlockCount = await BlockModel.getNumberOfBlocks({});
    await Helper.runExample("send-signed-tx");
    await Helper.worker.sync();
    const blockCount = await BlockModel.getNumberOfBlocks({});

    getBalanceStub.restore();
    getSeqStub.restore();
    await Helper.worker.sync();
    const newBlockCount = await BlockModel.getNumberOfBlocks({});

    expect(blockCount).toEqual(prevBlockCount);
    expect(newBlockCount).toEqual(blockCount + 1);
    done();
});

test("worker/account rpc fail", async done => {
    await Helper.worker.sync();

    const sendRpcRequestStub = sinon.stub(
        Helper.worker.context.sdk.rpc,
        "sendRpcRequest"
    );

    sendRpcRequestStub
        .withArgs("chain_getGenesisAccounts", [])
        .rejects(Error("ECONNREFUSED"));
    sendRpcRequestStub.callThrough();

    await Helper.runExample("send-signed-tx");
    await Helper.worker.sync();
    sendRpcRequestStub.restore();
    done();
});

test.skip("worker/index getBestBlockNumber rpc fail", async done => {
    await Helper.worker.sync();

    const getBestBlockNumberStub = sinon.stub(
        Helper.worker.context.sdk.rpc.chain,
        "getBestBlockNumber"
    );
    getBestBlockNumberStub.rejects(Error("ECONNREFUSED"));

    await Helper.runExample("send-signed-tx");
    await Helper.worker.sync();
    getBestBlockNumberStub.restore();
    done();
});

test("worker/index rpc fail", async done => {
    await Helper.worker.sync();

    const getBlockStub = sinon.stub(
        Helper.worker.context.sdk.rpc.chain,
        "getBlock"
    );

    getBlockStub.rejects(Error("ECONNREFUSED"));

    await Helper.runExample("send-signed-tx");
    await expect(Helper.worker.sync()).rejects.toEqual(Error("ECONNREFUSED"));
    getBlockStub.restore();
    done();
});
