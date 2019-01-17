import {
    Block,
    MintAsset,
    U64
} from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as AssetMintOutputModel from "../src/models/logic/assetmintoutput";
import * as AssetSchemeModel from "../src/models/logic/assetscheme";
import * as AssetTransferInputModel from "../src/models/logic/assettransferinput";
import * as AssetTransferOutputModel from "../src/models/logic/assettransferoutput";
import * as BlockModel from "../src/models/logic/block";
import * as TransactionModel from "../src/models/logic/transaction";
import * as UTXOModel from "../src/models/logic/utxo";
import * as Helper from "./helper";

let bestBlockNumber: number;
let mintBlock: Block;
let transferBlock: Block;

beforeAll(async done => {
    await Helper.setupDb();
    await Helper.runExample("import-test-account");
    await Helper.runExample("mint-and-transfer");
    bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    mintBlock = (await Helper.sdk.rpc.chain.getBlock(
        bestBlockNumber - 1
    ))!;
    transferBlock = (await Helper.sdk.rpc.chain.getBlock(
        bestBlockNumber
    ))!;
    done();
});

async function check(blockResponse: Block, type: string) {
    expect(blockResponse).toBeTruthy();

    const blockInst = await BlockModel.createBlock(blockResponse, {
        miningReward: new U64("1000"),
        invoices: [{ invoice: true}]
    });
    const blockDoc = blockInst.get({ plain: true });
    expect(blockDoc.hash).toEqual(blockResponse.hash.value);

    const signed = blockResponse.transactions[0];
    expect(signed).toBeTruthy();
    const txByHashInst = (await TransactionModel.getByHash(signed.hash()))!;
    expect(txByHashInst).toBeTruthy();
    const tx = txByHashInst.get({ plain: true });
    expect(tx.hash).toEqual(signed.hash().value);
    expect(tx.type).toEqual(type);
    expect(tx.tracker).toEqual((signed.unsigned as any).id().value);
}

test("mint", async done => {
    await check(mintBlock, "mintAsset");

    done();
});

test("transfer", async done => {
    await check(transferBlock, "transferAsset");

    done();
});

test("Check duplicated block", async done => {
    expect(transferBlock).toBeTruthy();

    // Duplicated error test
    try {
        await BlockModel.createBlock(transferBlock, {
            miningReward: new U64("1000"),
            invoices: [ { invoice: true}]
        });
        done.fail();
    } catch (e) {
        expect(e).toBeTruthy();
        expect(e.message).toEqual("AlreadyExist");

        done();
    }
});

test("Check assetScheme", async done => {
    const signed = mintBlock.transactions[0];
    expect(mintBlock).toBeTruthy();
    const assetType = (signed.unsigned as MintAsset).getAssetSchemeAddress();
    const assetSchemeInstance = (await AssetSchemeModel.getByAssetType(
        assetType
    ))!;
    expect(assetSchemeInstance).toBeTruthy();

    const assetScheme = assetSchemeInstance.get({ plain: true });

    expect(assetScheme.transactionHash).toEqual(signed.hash().value);

    done();
});

test("Check assetMintOutput", async done => {
    const signed = mintBlock.transactions[0];
    const mintOutputInst = await AssetMintOutputModel.getByTransactionHash(
        signed.hash().value
    );
    expect(mintOutputInst).toBeTruthy();

    done();
});

test("Check assetTransfer input output", async done => {
    const signed = transferBlock.transactions[0];
    const transferOutputInst = await AssetTransferOutputModel.getByTransactionHash(
        signed.hash().value
    );
    const { action: { inputs, outputs } } = signed.toJSON();
    expect(transferOutputInst.length).toEqual(outputs.length);

    const tranferInputInst = await AssetTransferInputModel.getByTransactionHash(
        signed.hash().value
    );
    expect(tranferInputInst.length).toEqual(inputs.length);

    done();
});

test.skip("Check utxo", async done => {
    const mintHash = mintBlock.transactions[0].hash();
    const mintOutputInst = await AssetMintOutputModel.getByTransactionHash(
        mintHash.value
    );

    const transferHash = transferBlock.transactions[0].hash().value;
    const transferOutputInst = await AssetTransferOutputModel.getByTransactionHash(
        transferHash
    );

    const mintOwner = mintOutputInst!.get("recipient");
    const utxoOfMintOwner = await UTXOModel.getByAddress(mintOwner);
    const utxoOfMintAssetInst = await UTXOModel.getByTxHashIndex(
        mintHash,
        0
    );

    expect(utxoOfMintOwner.length).toEqual(2);
    expect(utxoOfMintAssetInst!.get().usedTransactionHash).toBeTruthy();

    const firstOutputOwner = transferOutputInst[0].get("owner");
    const UTXOInst = await UTXOModel.getByAddress(firstOutputOwner!);
    expect(UTXOInst.length).not.toEqual(0);

    done();
});

test("Get block document containing action, transaction, output, input", async done => {
    const mintBlockInst = (await BlockModel.getByNumber(
        bestBlockNumber - 1
    ))!;
    expect(mintBlockInst).toBeTruthy();
    const mintBlockDoc = mintBlockInst.get({ plain: true });
    expect(mintBlockDoc.hash).toEqual(mintBlock.hash.value);
    expect(mintBlockDoc.transactions![0].hash).toEqual(mintBlock.transactions[0].hash().value);
    expect(mintBlockDoc.transactions![0].type).toEqual(
        "mintAsset"
    );
    expect(mintBlockDoc.transactions![0].mintAsset!.output).toBeTruthy();


    const transferBlockInst = (await BlockModel.getByNumber(
        bestBlockNumber
    ))!;
    expect(transferBlockInst).toBeTruthy();
    const transferBlockDoc = transferBlockInst.get({ plain: true });
    expect(transferBlockDoc.hash).toEqual(transferBlock.hash.value);
    expect(transferBlockDoc.transactions![0].hash).toEqual(transferBlock.transactions[0].hash().value);
    expect(transferBlockDoc.transactions![0].type).toEqual(
        "transferAsset"
    );
    expect(transferBlockDoc.transactions![0].transferAsset!.inputs).toBeTruthy();
    expect(transferBlockDoc.transactions![0].transferAsset!.outputs).toBeTruthy();
    expect(transferBlockDoc.transactions![0].transferAsset!.inputs!.length).toEqual(
        transferBlock.transactions[0].unsigned.toJSON().action.inputs.length
    );
    expect(transferBlockDoc.transactions![0].transferAsset!.outputs!.length).toEqual(
        transferBlock.transactions[0].unsigned.toJSON().action.outputs.length
    );

    done();
});

afterAll(async done => {
    await models.sequelize.close();
    await Helper.dropDb();
    done();
});
