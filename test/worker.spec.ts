import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { Pay } from "codechain-sdk/lib/core/classes";
import "mocha";
import * as sinon from "sinon";
import * as AccountModel from "../src/models/logic/account";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("worker", function() {
    before(async function() {
        await Helper.resetDb();
        await Helper.runExample("import-test-account");
        await Helper.runExample("send-signed-tx");
    });

    it("Sync block test", async function() {
        this.timeout("30s");
        const beforeLatestBlockInst = await BlockModel.getLatestBlock();

        await Helper.worker.sync();

        const paymentBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        const paymentBlock = await Helper.sdk.rpc.chain.getBlock(
            paymentBlockNumber
        );
        const afterLatestBlockInst = await BlockModel.getLatestBlock();

        expect(afterLatestBlockInst).not.null;
        const afterLatestBlockDoc = afterLatestBlockInst!.get();
        if (beforeLatestBlockInst) {
            const beforeLatestBlockDoc = beforeLatestBlockInst!.get();
            expect(beforeLatestBlockDoc.number).not.equal(
                afterLatestBlockDoc.number
            );
            expect(beforeLatestBlockDoc.hash).not.equal(
                afterLatestBlockDoc.hash
            );
        }
        expect(afterLatestBlockDoc.hash).equal(paymentBlock!.hash.value);
    });

    it.skip("Sync account test", async function() {
        this.timeout("30s");
        const genesisAccounts: string[] = await Helper.sdk.rpc.sendRpcRequest(
            "chain_getGenesisAccounts",
            []
        );

        if (genesisAccounts.length > 0) {
            const accountInst = await AccountModel.getByAddress(
                genesisAccounts[0]
            );
            expect(accountInst).not.null;
        }

        const paymentBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        const paymentBlock = await Helper.sdk.rpc.chain.getBlock(
            paymentBlockNumber
        );
        expect(paymentBlock!.transactions[0]!.unsigned.type()).equal("pay");
        // FIXME: remove any
        const receiver = ((paymentBlock!.transactions[0]!
            .unsigned as Pay) as any).receiver.value;
        const receiverInst = await AccountModel.getByAddress(receiver);
        const receiverBalance = receiverInst!.get("balance");

        await Helper.runExample("send-signed-tx");
        await Helper.worker.sync();

        const newReceiverInst = await AccountModel.getByAddress(receiver);
        const newReceiverBalance = newReceiverInst!.get();
        expect(newReceiverBalance.balance).not.equal(receiverBalance);
    });

    it.skip("worker/account rpc fail", async function() {
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

        expect(blockCount).equal(prevBlockCount);
        expect(newBlockCount).equal(blockCount + 1);
    });

    it("worker/account rpc fail", async function() {
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
    });

    it.skip("worker/index getBestBlockNumber rpc fail", async function() {
        await Helper.worker.sync();

        const getBestBlockNumberStub = sinon.stub(
            Helper.worker.context.sdk.rpc.chain,
            "getBestBlockNumber"
        );
        getBestBlockNumberStub.rejects(Error("ECONNREFUSED"));

        await Helper.runExample("send-signed-tx");
        await Helper.worker.sync();
        getBestBlockNumberStub.restore();
    });

    it("worker/index rpc fail", async function() {
        await Helper.worker.sync();

        const getBlockStub = sinon.stub(
            Helper.worker.context.sdk.rpc.chain,
            "getBlock"
        );

        getBlockStub.rejects(Error("ECONNREFUSED"));

        await Helper.runExample("send-signed-tx");
        await expect(Helper.worker.sync()).to.be.rejected;
        getBlockStub.restore();
    });
});
