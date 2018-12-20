import { U64 } from "codechain-primitives/lib";
import {
    AssetMintTransaction,
    AssetTransaction,
    AssetTransferTransaction,
    Block,
    SignedParcel
} from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import { AssetTransactionAttribute } from "../src/models/action";
import * as ActionModel from "../src/models/logic/action";
import * as AssetMintOutputModel from "../src/models/logic/assetmintoutput";
import * as BlockModel from "../src/models/logic/block";
import * as ParcelModel from "../src/models/logic/parcel";
import * as TransactionModel from "../src/models/logic/transaction";
import { AssetMintTransactionAttribute } from "../src/models/transaction";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.runExample("import-test-account");
    // FIXME: If seq is zero, an error is occurs.
    // https://github.com/CodeChain-io/codechain-sdk-js/pull/278
    await Helper.runExample("mint-and-transfer");
    await Helper.runExample("mint-and-transfer");
    done();
});

afterAll(async done => {
    await Helper.db.end();
    await models.sequelize.close();
    done();
});

let mintBlockNumber: number;
let transferBlockNumber: number;
let mintBlock: Block;
let transferBlock: Block;
let mintParcel: SignedParcel;
let transferParcel: SignedParcel;
let mintAction: AssetTransaction;
let transferAction: AssetTransaction;
let transferActionId: string;
let mintActionId: string;
let mintTransaction: AssetMintTransaction;
let transferTransaction: AssetTransferTransaction;
let mintTransactionOutputId: string;

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
    const mintBlockInstance = await BlockModel.createBlock(
        mintBlock,
        new U64("1000")
    );
    const transferBlockInstance = await BlockModel.createBlock(
        transferBlock,
        new U64("1000")
    );
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
        await BlockModel.createBlock(transferBlock, new U64("1000"));
    } catch (e) {
        error = e;
    }
    expect(error).toBeTruthy();

    error = error!;
    expect(error.message).toEqual("AlreadyExist");

    done();
});

test("Check parcel", async done => {
    mintParcel = mintBlock.parcels[0];
    transferParcel = transferBlock.parcels[0];

    expect(mintParcel).toBeTruthy();
    expect(transferParcel).toBeTruthy();

    let mintParcelInstance = await ParcelModel.getByHash(mintParcel.hash());
    let transferParcelInstance = await ParcelModel.getByHash(
        transferParcel.hash()
    );

    expect(mintParcelInstance).toBeTruthy();
    expect(transferParcelInstance).toBeTruthy();
    mintParcelInstance = mintParcelInstance!;
    transferParcelInstance = transferParcelInstance!;

    const mintParcelDoc = mintParcelInstance.get({ plain: true });
    const transferParcelDoc = transferParcelInstance.get({ plain: true });

    expect(mintParcelDoc.hash).toEqual(mintParcel.hash().value);
    expect(transferParcelDoc.hash).toEqual(transferParcel.hash().value);

    done();
});

test("Check action", async done => {
    mintAction = mintParcel.unsigned.action as AssetTransaction;
    transferAction = transferParcel.unsigned.action as AssetTransaction;

    expect(mintAction.transaction).toBeInstanceOf(AssetMintTransaction);
    expect(transferAction.transaction).toBeInstanceOf(AssetTransferTransaction);

    mintParcel = mintParcel!;
    transferParcel = transferParcel!;
    let mintActionInstance = await ActionModel.getByHash(mintParcel.hash());
    let transferActionInstance = await ActionModel.getByHash(
        transferParcel.hash()
    );

    expect(mintActionInstance).toBeTruthy();
    expect(transferActionInstance).toBeTruthy();

    mintActionInstance = mintActionInstance!;
    transferActionInstance = transferActionInstance!;

    const mintActionDoc = mintActionInstance.get({ plain: true });
    const transferActionDoc = transferActionInstance.get({ plain: true });

    expect(mintActionDoc.action).toEqual("assetTransaction");
    expect(transferActionDoc.action).toEqual("assetTransaction");
    expect(mintActionDoc.id).toBeTruthy();
    expect(transferActionDoc.id).toBeTruthy();

    mintActionId = mintActionDoc.id!;
    transferActionId = transferActionDoc.id!;
    expect(mintActionId).toBeTruthy();
    expect(transferActionId).toBeTruthy();

    done();
});

test("Check transaction", async done => {
    mintTransaction = mintAction.transaction as AssetMintTransaction;
    transferTransaction = transferAction.transaction as AssetTransferTransaction;

    let mintTransactionInstance = await TransactionModel.getByHash(
        mintTransaction.hash()
    );
    let transferTransactionInstance = await TransactionModel.getByHash(
        transferTransaction.hash()
    );

    expect(mintTransactionInstance).toBeTruthy();
    expect(transferTransactionInstance).toBeTruthy();

    mintTransactionInstance = mintTransactionInstance!;
    transferTransactionInstance = transferTransactionInstance!;

    const mintTransactionDoc = mintTransactionInstance.get({ plain: true });
    const transferTransactionDoc = transferTransactionInstance.get({
        plain: true
    });

    expect(mintTransactionDoc.hash).toEqual(mintTransaction.hash().value);
    expect(transferTransactionDoc.hash).toEqual(
        transferTransaction.hash().value
    );

    done();
});

test("Get block docuemnt containing parcel, action, transaction", async done => {
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

    expect(savedTransferBlockDoc.parcels).toBeTruthy();
    expect(savedTransferBlockDoc.parcels![0].hash).toEqual(
        transferParcel.hash().value
    );

    expect(savedTransferBlockDoc.parcels![0].action).toBeTruthy();
    expect(savedTransferBlockDoc.parcels![0].action!.action).toEqual(
        "assetTransaction"
    );

    const savedTransferTransactionDoc = (savedTransferBlockDoc.parcels![0]
        .action! as AssetTransactionAttribute).transaction;
    expect(savedTransferTransactionDoc).toBeTruthy();

    const savedMintTransactionDoc = (savedMintBlockDoc.parcels![0]
        .action! as AssetTransactionAttribute)
        .transaction as AssetMintTransactionAttribute;
    expect(savedMintTransactionDoc).toBeTruthy();
    expect(savedMintTransactionDoc.output).toBeTruthy();

    mintTransactionOutputId = savedMintTransactionDoc.output!.id!;

    done();
});

test("Delete the block, parcel, action as cascade", async done => {
    const row = await BlockModel.deleteBlockByNumber(transferBlockNumber);
    expect(row).toBeTruthy();

    const mintTxRow = await BlockModel.deleteBlockByNumber(mintBlockNumber);
    expect(mintTxRow).toBeTruthy();

    const blockInstance = await BlockModel.getByNumber(transferBlockNumber);
    expect(blockInstance).toBeNull();

    const transferParcelHash = transferParcel.hash();
    const parcelInstance = await ParcelModel.getByHash(transferParcelHash);
    expect(parcelInstance).toBeNull();

    const actionInstance = await ActionModel.getByHash(transferParcelHash);
    expect(actionInstance).toBeNull();

    const transferTransactionHash = transferTransaction.hash();
    const transactionInstance = await TransactionModel.getByHash(
        transferTransactionHash
    );
    expect(transactionInstance).toBeNull();

    const mintTransactionHash = mintTransaction.hash();
    const mintTransactionInstance = await TransactionModel.getByHash(
        mintTransactionHash
    );
    expect(mintTransactionInstance).toBeNull();

    const mintOutputInstance = await AssetMintOutputModel.getById(
        mintTransactionOutputId
    );
    expect(mintOutputInstance).toBeNull();

    done();
});
