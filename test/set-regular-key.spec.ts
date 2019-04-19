import { expect } from "chai";
import "mocha";
import { SignedTransaction } from "codechain-sdk/lib/core/SignedTransaction";
import * as AccountModel from "../src/models/logic/account";
import * as Helper from "./helper";

describe("set-regular-key", function() {
    it("1 transaction after Set regular key", async function() {
        await testPayAfterSetRegularKey(1);
    });

    it("3 transactions after Set regular key", async function() {
        await testPayAfterSetRegularKey(3);
    });

    it("10 transactions after Set regular key", async function() {
        await testPayAfterSetRegularKey(10);
    });

    it("100 transactions after Set regular key", async function() {
        await testPayAfterSetRegularKey(100);
    });

    it("1000 transactions after Set regular key", async function() {
        await testPayAfterSetRegularKey(1000);
    });
});

async function prepareRegularKeyRegisteredAccount(
    quantity: number,
    masterPrivateKey: string,
    regularPrivateKey: string
) {
    const masterAccountId = Helper.sdk.util
        .getAccountIdFromPrivate(masterPrivateKey)
        .toString();
    const master = Helper.sdk.core.classes.PlatformAddress.fromAccountId(
        masterAccountId,
        {
            networkId: Helper.sdk.networkId
        }
    ).toString();

    {
        const seq = await Helper.sdk.rpc.chain.getSeq(Helper.ACCOUNT_ADDRESS);
        const signed = Helper.sdk.core
            .createPayTransaction({
                quantity,
                recipient: master
            })
            .sign({
                secret: Helper.ACCOUNT_SECRET,
                fee: 10,
                seq
            });
        const blockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        await Helper.sdk.rpc.chain.sendSignedTransaction(signed);
        await waitBlock(blockNumber + 1);
        expect(await Helper.sdk.rpc.chain.getTransaction(signed.hash())).not
            .null;
    }

    const key = Helper.sdk.util.getPublicFromPrivate(regularPrivateKey);
    {
        const seq = await Helper.sdk.rpc.chain.getSeq(master);
        const signed = Helper.sdk.core
            .createSetRegularKeyTransaction({ key })
            .sign({
                secret: masterPrivateKey,
                fee: 10,
                seq
            });
        const blockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        await Helper.sdk.rpc.chain.sendSignedTransaction(signed);
        await waitBlock(blockNumber + 1);
        expect(await Helper.sdk.rpc.chain.getTransaction(signed.hash())).not
            .null;
    }
}

function createSignedPay(params: {
    count: number;
    quantity: number;
    fee: number;
    seq: number;
    secret: string;
}): SignedTransaction[] {
    const { count, quantity, fee, seq, secret } = params;
    const transactions = [];
    for (let i = 0; i < count; i += 1) {
        transactions.push(
            Helper.sdk.core
                .createPayTransaction({
                    recipient: Helper.ACCOUNT_ADDRESS,
                    quantity
                })
                .sign({
                    secret,
                    fee,
                    seq: seq + i
                })
        );
    }
    return transactions;
}

async function testPayAfterSetRegularKey(countOfPayment: number) {
    const masterPrivateKey = Helper.sdk.util.generatePrivateKey();
    const masterAccountId = Helper.sdk.util
        .getAccountIdFromPrivate(masterPrivateKey)
        .toString();
    const master = Helper.sdk.core.classes.PlatformAddress.fromAccountId(
        masterAccountId,
        {
            networkId: Helper.sdk.networkId
        }
    ).toString();

    const TOTAL_QUANTITY = 1_000_000_000;
    const regularPrivateKey = Helper.sdk.util.generatePrivateKey();
    const regularAccountId = Helper.sdk.util
        .getAccountIdFromPrivate(regularPrivateKey)
        .toString();
    const regular = Helper.sdk.core.classes.PlatformAddress.fromAccountId(
        regularAccountId,
        {
            networkId: Helper.sdk.networkId
        }
    ).toString();

    await prepareRegularKeyRegisteredAccount(
        TOTAL_QUANTITY,
        masterPrivateKey,
        regularPrivateKey
    );

    const blockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    const seq = await Helper.sdk.rpc.chain.getSeq(master);

    const quantity = 1000;
    const fee = 100;
    await Helper.sdk.rpc.devel.stopSealing();
    const transactions = await createSignedPay({
        seq,
        fee,
        secret: regularPrivateKey,
        quantity,
        count: countOfPayment
    });
    await Promise.all(
        transactions.map(tx => Helper.sdk.rpc.chain.sendSignedTransaction(tx))
    );
    const lastHash = transactions[countOfPayment - 1].hash();
    await Helper.sdk.rpc.devel.startSealing();
    await waitBlock(blockNumber + 1);
    expect(await Helper.sdk.rpc.chain.getBestBlockNumber()).equal(
        blockNumber + 1
    );
    expect(await Helper.sdk.rpc.chain.containsTransaction(lastHash)).not.null;

    const REMAIN = (
        TOTAL_QUANTITY -
        10 -
        (fee + quantity) * countOfPayment
    ).toString();

    expect(await Helper.sdk.rpc.chain.getSeq(master)).equal(
        seq + countOfPayment
    );
    expect((await Helper.sdk.rpc.chain.getBalance(master)).toString(10)).equal(
        REMAIN
    );
    expect(await Helper.sdk.rpc.chain.getSeq(regular)).equal(0);
    expect((await Helper.sdk.rpc.chain.getBalance(regular)).toString(10)).equal(
        (0).toString()
    );

    await Helper.worker.sync();

    const masterAccount = (await AccountModel.getByAddress(master))!;
    expect(masterAccount).not.null;
    expect(masterAccount.get("balance")).equal(REMAIN);
    expect(masterAccount.get("seq")).equal(seq + countOfPayment);

    const regularAccount = (await AccountModel.getByAddress(regular))!;
    expect(regularAccount).be.null;
}

async function waitBlock(block: number) {
    while ((await Helper.sdk.rpc.chain.getBestBlockNumber()) < block) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}
