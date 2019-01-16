import {
    Block,
    H256,
    MintAsset,
    SignedTransaction,
    TransferAsset,
    U64
} from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import { MintAssetAttribute, TransferAssetAttribute } from "../src/models/action";
import * as ActionModel from "../src/models/logic/action";
import * as AssetMintOutputModel from "../src/models/logic/assetmintoutput";
import * as AssetSchemeModel from "../src/models/logic/assetscheme";
import * as AssetTransferInputModel from "../src/models/logic/assettransferinput";
import * as AssetTransferOutputModel from "../src/models/logic/assettransferoutput";
import * as BlockModel from "../src/models/logic/block";
import * as TransactionModel from "../src/models/logic/transaction";
import * as UTXOModel from "../src/models/logic/utxo";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.setupDb();
    await Helper.runExample("import-test-account");
    await Helper.runExample("mint-and-transfer");
    done();
});

afterAll(async done => {
    await models.sequelize.close();
    await Helper.dropDb();
    done();
});

let mintBlockNumber: number;
let transferBlockNumber: number;
let mintBlock: Block;
let transferBlock: Block;
let signedMint: SignedTransaction;
let signedTransfer: SignedTransaction;
let mintTransaction: MintAsset;
let transferTransaction: TransferAsset;
let transferActionId: number;
let mintActionId: number;
let assetType: H256;

test("Create mint transfer block", async done => {
    const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    mintBlockNumber = bestBlockNumber - 1;
    transferBlockNumber = bestBlockNumber;
    const mintBlockResponse = await Helper.sdk.rpc.chain.getBlock(
        mintBlockNumber
    );
    const transferBlockResponse = await Helper.sdk.rpc.chain.getBlock(
        transferBlockNumber
    );

    expect(mintBlockResponse).toBeTruthy();
    expect(transferBlockResponse).toBeTruthy();

    mintBlock = mintBlockResponse!;
    transferBlock = transferBlockResponse!;

    // Create block
    const mintBlockInstance = await BlockModel.createBlock(mintBlock, {
        miningReward: new U64("1000"),
        invoices: [{ invoice: true}]
    });
    const transferBlockInstance = await BlockModel.createBlock(transferBlock, {
        miningReward: new U64("1000"),
        invoices: [{ invoice: true}]
    });
    const mintBlockDoc = mintBlockInstance.get({ plain: true });
    const transferBlockDoc = transferBlockInstance.get({ plain: true });

    expect(mintBlockDoc.hash).toEqual(mintBlock.hash.value);
    expect(transferBlockDoc.hash).toEqual(transferBlock.hash.value);

    done();
});

test("Check duplicated block", async done => {
    // Duplicated error test
    let error: Error | null = null;
    try {
        await BlockModel.createBlock(transferBlock, {
            miningReward: new U64("1000"),
            invoices: [ { invoice: true}]
        });
    } catch (e) {
        error = e;
    }
    expect(error).toBeTruthy();

    error = error!;
    expect(error.message).toEqual("AlreadyExist");

    done();
});

test("Check transaction", async done => {
    signedMint = mintBlock.transactions[0];
    signedTransfer = transferBlock.transactions[0];

    expect(signedMint).toBeTruthy();
    expect(signedTransfer).toBeTruthy();

    const mintInstance = (await TransactionModel.getByHash(signedMint.hash()))!;
    const transferInstance = (await TransactionModel.getByHash(signedTransfer.hash()))!;

    expect(mintInstance).toBeTruthy();
    expect(transferInstance).toBeTruthy();

    const mintDoc = mintInstance.get({ plain: true });
    const transferDoc = transferInstance.get({ plain: true });

    expect(mintDoc.hash).toEqual(signedMint.hash().value);
    expect(mintDoc.type).toEqual("mintAsset");
    expect(transferDoc.hash).toEqual(signedTransfer.hash().value);
    expect(transferDoc.type).toEqual("transferAsset");

    done();
});

test("Check action", async done => {
    signedMint = signedMint!;
    signedTransfer = signedTransfer!;

    mintTransaction = signedMint.unsigned as MintAsset;
    transferTransaction = signedTransfer.unsigned as TransferAsset;

    expect(mintTransaction).toBeInstanceOf(MintAsset);
    expect(transferTransaction).toBeInstanceOf(TransferAsset);

    const mintActionInstance = (await ActionModel.getByHash(signedMint.hash()))!;
    const transferActionInstance = (await ActionModel.getByHash(
        signedTransfer.hash()
    ))!;

    expect(mintActionInstance).toBeTruthy();
    expect(transferActionInstance).toBeTruthy();

    const mintActionDoc = mintActionInstance.get({ plain: true });
    const transferActionDoc = transferActionInstance.get({ plain: true });

    expect(mintActionDoc.type).toEqual("mintAsset");
    expect(transferActionDoc.type).toEqual("transferAsset");
    expect(mintActionDoc.id).toBeTruthy();
    expect(transferActionDoc.id).toBeTruthy();

    mintActionId = mintActionDoc.id!;
    transferActionId = transferActionDoc.id!;
    expect(mintActionId).toBeTruthy();
    expect(transferActionId).toBeTruthy();

    done();
});

test("Check transaction", async done => {
    let mintTransactionInstance = await TransactionModel.getByHash(
        signedMint.hash()
    );
    let transferTransactionInstance = await TransactionModel.getByHash(
        signedTransfer.hash()
    );

    expect(mintTransactionInstance).toBeTruthy();
    expect(transferTransactionInstance).toBeTruthy();

    mintTransactionInstance = mintTransactionInstance!;
    transferTransactionInstance = transferTransactionInstance!;

    const mintTransactionDoc = mintTransactionInstance.get({ plain: true });
    const transferTransactionDoc = transferTransactionInstance.get({
        plain: true
    });

    expect(mintTransactionDoc.hash).toEqual(signedMint.hash().value);
    expect(transferTransactionDoc.hash).toEqual(
        signedTransfer.hash().value
    );

    done();
});

test("Check assetScheme", async done => {
    assetType = mintTransaction.getAssetSchemeAddress();
    const assetSchemeInstance = await AssetSchemeModel.getByAssetType(
        assetType
    );
    expect(assetSchemeInstance).toBeTruthy();

    const assetSchemeDoc = assetSchemeInstance!.get({ plain: true });
    const mintActionInstance = (await ActionModel.getByHash(signedMint.hash()))!;
    // FIXME: sequelize returns a string for "id" because it's a bigint.
    expect(String(assetSchemeDoc.actionId)).toEqual(
        mintActionInstance.getDataValue("id")
    );

    done();
});

test("Check assetMintOutput", async done => {
    const mintActionInstance = (await ActionModel.getByHash(signedMint.hash()))!;
    const mintOutputInst = await AssetMintOutputModel.getByActionId(
        mintActionInstance.getDataValue("id")
    );
    expect(mintOutputInst).toBeTruthy();

    done();
});

test("Check assetTransfer input output", async done => {
    const transferActionInstance = (await ActionModel.getByHash(signedTransfer.hash()))!;
    const transferOutputInst = await AssetTransferOutputModel.getByActionId(
        transferActionInstance.getDataValue("id")
    );
    expect(transferOutputInst.length).not.toEqual(0);

    const tranferInputInst = await AssetTransferInputModel.getByactionId(
        transferActionInstance.getDataValue("id")
    );
    expect(tranferInputInst.length).not.toEqual(0);

    done();
});

test.skip("Check utxo", async done => {
    const mintHash = signedMint.hash();
    const mintActionInstance = (await ActionModel.getByHash(mintHash))!;
    const mintOutputInst = await AssetMintOutputModel.getByActionId(
        mintActionInstance.getDataValue("id")
    );

    const transferActionInstance = (await ActionModel.getByHash(signedTransfer.hash()))!;
    const transferOutputInst = await AssetTransferOutputModel.getByActionId(
        transferActionInstance.getDataValue("id")
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
    const savedTransfterBlockResponse = await BlockModel.getByNumber(
        transferBlockNumber
    );
    expect(savedTransfterBlockResponse).toBeTruthy();

    const savedMintBlockResponse = await BlockModel.getByNumber(
        mintBlockNumber
    );
    expect(savedMintBlockResponse).toBeTruthy();

    const savedTransferBlock = savedTransfterBlockResponse!;
    const savedTransferBlockDoc = savedTransferBlock.get({ plain: true });

    const savedMintBlock = savedMintBlockResponse!;
    const savedMintBlockDoc = savedMintBlock.get({ plain: true });

    expect(savedTransferBlockDoc.hash).toEqual(transferBlock.hash.value);

    expect(savedTransferBlockDoc.transactions).toBeTruthy();
    expect(savedTransferBlockDoc.transactions![0].hash).toEqual(
        signedTransfer.hash().value
    );

    expect(savedTransferBlockDoc.transactions![0].actionId).toBeTruthy();
    expect(savedTransferBlockDoc.transactions![0].action!.type).toEqual(
        "transferAsset"
    );

    expect(savedTransferBlockDoc.transactions![0].type).toBe("transferAsset");
    expect(savedTransferBlockDoc.transactions![0].action!.type).toBe("transferAsset");
    // @ts-ignore
    const savedTransferTransactionDoc = (savedTransferBlockDoc.transactions![0].action) as TransferAssetAttribute;
    expect(savedTransferTransactionDoc).toBeTruthy();

    expect(savedMintBlockDoc.transactions![0].type).toBe("mintAsset");
    expect(savedMintBlockDoc.transactions![0].action!.type).toBe("mintAsset");
    const savedMintTransactionDoc = (savedMintBlockDoc.transactions![0].action) as MintAssetAttribute;
    expect(savedMintTransactionDoc).toBeTruthy();
    expect(savedMintTransactionDoc.output).toBeTruthy();

    const savedTransferInput = savedTransferTransactionDoc.inputs;
    const savedTransferOutput = savedTransferTransactionDoc.outputs;
    expect(savedTransferInput).toBeTruthy();
    expect(savedTransferOutput).toBeTruthy();

    done();
});

test("Delete the block, action as cascade", async done => {
    const row = await BlockModel.deleteBlockByNumber(transferBlockNumber);
    expect(row).toBeTruthy();

    const mintTransactionHash = signedMint.hash();
    const mintActionInstance = (await ActionModel.getByHash(mintTransactionHash))!;
    const mintOutputInst = await AssetMintOutputModel.getByActionId(
        mintActionInstance.getDataValue("id")
    );
    const mintOwner = mintOutputInst!.get().recipient;
    const utxoOfMintOwner = await UTXOModel.getByAddress(mintOwner);
    const utxoOfMintAssetInst = await UTXOModel.getByTxHashIndex(
        mintTransactionHash,
        0
    );
    expect(utxoOfMintOwner.length).toEqual(1);
    expect(utxoOfMintAssetInst!.get().usedTransactionHash).toBeNull();

    const mintTxRow = await BlockModel.deleteBlockByNumber(mintBlockNumber);
    expect(mintTxRow).toBeTruthy();

    const blockInstance = await BlockModel.getByNumber(transferBlockNumber);
    expect(blockInstance).toBeNull();

    const transferHash = signedTransfer.hash();
    const transferInstance = await TransactionModel.getByHash(transferHash);
    expect(transferInstance).toBeNull();

    const actionInstance = await ActionModel.getByHash(transferHash);
    expect(actionInstance).toBeNull();

    const transferTransactionHash = transferTransaction.hash();
    const transactionInstance = await TransactionModel.getByHash(
        transferTransactionHash
    );
    expect(transactionInstance).toBeNull();

    const mintTransactionInstance = await TransactionModel.getByHash(
        mintTransactionHash
    );
    expect(mintTransactionInstance).toBeNull();

    const assetSchemeInstance = await AssetSchemeModel.getByAssetType(
        assetType
    );
    // asset scheme is not cascaded
    expect(assetSchemeInstance).not.toBeNull();

    done();
});
