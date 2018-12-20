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
import * as BlockModel from "../src/models/logic/block";
import * as ParcelModel from "../src/models/logic/parcel";
import * as TransactionModel from "../src/models/logic/transaction";
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

test("Create mint transfer block", async done => {
    const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    mintBlockNumber = bestBlockNumber - 1;
    transferBlockNumber = bestBlockNumber;
    const mintBlockResponse = await Helper.sdk.rpc.chain.getBlock(mintBlockNumber);
    const transferBlockResponse = await Helper.sdk.rpc.chain.getBlock(transferBlockNumber);

    expect(mintBlockResponse).toBeTruthy();
    expect(transferBlockResponse).toBeTruthy();

    mintBlock = mintBlockResponse!;
    transferBlock = transferBlockResponse!;

    // Create block
    const mintBlockInstance = await BlockModel.createBlock(mintBlock, new U64("1000"));
    const transferBlockInstance = await BlockModel.createBlock(transferBlock, new U64("1000"));
    const mintBlockDoc = mintBlockInstance.get({ plain: true });
    const transferBlockDoc = transferBlockInstance.get({ plain: true });

    expect(mintBlockDoc.hash).toEqual(mintBlock.hash.value);
    expect(transferBlockDoc.hash).toEqual(transferBlock.hash.value);

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

    // Check parcel
    mintParcel = mintBlock.parcels[0];
    transferParcel = transferBlock.parcels[0];

    expect(mintParcel).toBeTruthy();
    expect(transferParcel).toBeTruthy();

    let mintParcelInstance = await ParcelModel.getByHash(mintParcel.hash());
    let transferParcelInstance = await ParcelModel.getByHash(transferParcel.hash());

    expect(mintParcelInstance).toBeTruthy();
    expect(transferParcelInstance).toBeTruthy();
    mintParcelInstance = mintParcelInstance!;
    transferParcelInstance = transferParcelInstance!;

    const mintParcelDoc = mintParcelInstance.get({ plain: true });
    const transferParcelDoc = transferParcelInstance.get({ plain: true });

    expect(mintParcelDoc.hash).toEqual(mintParcel.hash().value);
    expect(transferParcelDoc.hash).toEqual(transferParcel.hash().value);

    // Check Action
    mintAction = mintParcel.unsigned.action as AssetTransaction;
    transferAction = transferParcel.unsigned.action as AssetTransaction;

    expect(mintAction.transaction).toBeInstanceOf(AssetMintTransaction);
    expect(transferAction.transaction).toBeInstanceOf(AssetTransferTransaction);

    mintParcel = mintParcel!;
    transferParcel = transferParcel!;
    let mintActionInstance = await ActionModel.getByHash(mintParcel.hash());
    let transferActionInstance = await ActionModel.getByHash(transferParcel.hash());

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

    // check transaction
    mintTransaction = mintAction.transaction as AssetMintTransaction;
    transferTransaction = transferAction.transaction as AssetTransferTransaction;

    let mintTransactionInstance = await TransactionModel.getByHash(mintTransaction.hash());
    let transferTransactionInstance = await TransactionModel.getByHash(transferTransaction.hash());

    expect(mintTransactionInstance).toBeTruthy();
    expect(transferTransactionInstance).toBeTruthy();

    mintTransactionInstance = mintTransactionInstance!;
    transferTransactionInstance = transferTransactionInstance!;

    const mintTransactionDoc = mintTransactionInstance.get({ plain: true });
    const transferTransactionDoc = transferTransactionInstance.get({ plain: true });

    expect(mintTransactionDoc.hash).toEqual(mintTransaction.hash().value);
    expect(transferTransactionDoc.hash).toEqual(transferTransaction.hash().value);

    done();
});

test("Get block docuemnt containing parcel, action, transaction", async done => {
    const savedTransfterBlockResponse = await BlockModel.getByNumber(transferBlockNumber);
    expect(savedTransfterBlockResponse).toBeTruthy();

    const savedBlock = savedTransfterBlockResponse!;
    const savedBlockDoc = savedBlock.get({ plain: true });

    expect(savedBlockDoc.hash).toEqual(transferBlock.hash.value);

    expect(savedBlockDoc.parcels).toBeTruthy();
    expect(savedBlockDoc.parcels![0].hash).toEqual(transferParcel.hash().value);

    expect(savedBlockDoc.parcels![0].action).toBeTruthy();
    expect(savedBlockDoc.parcels![0].action!.action).toEqual("assetTransaction");

    expect((savedBlockDoc.parcels![0].action! as AssetTransactionAttribute).transaction).toBeTruthy();

    done();
});

test("Delete the block, parcel, action as cascade", async done => {
    const row = await BlockModel.deleteBlockByNumber(transferBlockNumber);
    expect(row).toBeTruthy();

    const blockInstance = await BlockModel.getByNumber(transferBlockNumber);
    expect(blockInstance).toBeNull();

    const transferParcelHash = transferParcel.hash();
    const parcelInstance = await ParcelModel.getByHash(transferParcelHash);
    expect(parcelInstance).toBeNull();

    const actionInstance = await ActionModel.getByHash(transferParcelHash);
    expect(actionInstance).toBeNull();

    const transferTransactionHash = transferTransaction.hash();
    const transactionInstance = await TransactionModel.getByHash(transferTransactionHash);
    expect(transactionInstance).toBeNull();

    done();
});
