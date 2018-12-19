import { U64 } from "codechain-primitives/lib";
import {
    AssetMintTransaction,
    AssetTransaction,
    AssetTransferTransaction,
    Block,
    SignedParcel
} from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as ActionModel from "../src/models/logic/action";
import * as BlockModel from "../src/models/logic/block";
import * as ParcelModel from "../src/models/logic/parcel";
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

let bestBlockNumber: number;
let mintBlock: Block;
let transferBlock: Block;
let mintParcel: SignedParcel;
let transferParcel: SignedParcel;
let mintAction: AssetTransaction;
let transferAction: AssetTransaction;
test("Create mint transfer block", async done => {
    bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    const mintBlockResponse = await Helper.sdk.rpc.chain.getBlock(bestBlockNumber - 1);
    const transferBlockResponse = await Helper.sdk.rpc.chain.getBlock(bestBlockNumber);

    expect(mintBlockResponse).toBeTruthy();
    expect(transferBlockResponse).toBeTruthy();

    mintBlock = mintBlockResponse!;
    transferBlock = transferBlockResponse!;

    const mintBlockInstance = await BlockModel.createBlock(mintBlock, new U64("1000"));
    const transferBlockInstance = await BlockModel.createBlock(transferBlock, new U64("1000"));
    const mintBlockDoc = mintBlockInstance.get({ plain: true });
    const transferBlockDoc = transferBlockInstance.get({ plain: true });

    expect(mintBlockDoc.hash).toEqual(mintBlock.hash.value);
    expect(transferBlockDoc.hash).toEqual(transferBlock.hash.value);
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

test("Create mint transfer parcel", async done => {
    mintParcel = mintBlock.parcels[0];
    transferParcel = transferBlock.parcels[0];

    expect(mintParcel).toBeTruthy();
    expect(transferParcel).toBeTruthy();

    mintParcel = mintParcel!;
    transferParcel = transferParcel!;
    const mintParcelInstance = await ParcelModel.createParcel(mintParcel);
    const transferParcelInstance = await ParcelModel.createParcel(transferParcel);
    const mintParcelDoc = mintParcelInstance.get({ plain: true });
    const transferParcelDoc = transferParcelInstance.get({ plain: true });

    expect(mintParcelDoc.hash).toEqual(mintParcel.hash().value);
    expect(transferParcelDoc.hash).toEqual(transferParcel.hash().value);

    expect(mintParcel.unsigned.action).toBeInstanceOf(AssetTransaction);
    expect(transferParcel.unsigned.action).toBeInstanceOf(AssetTransaction);

    let error: Error | null = null;
    try {
        await ParcelModel.createParcel(mintParcel);
    } catch (e) {
        error = e;
    }
    expect(error).toBeTruthy();

    error = error!;
    expect(error.message).toEqual("AlreadyExist");

    done();
});

test("Create mint transfer action", async done => {
    mintAction = mintParcel.unsigned.action as AssetTransaction;
    transferAction = transferParcel.unsigned.action as AssetTransaction;

    expect(mintAction.transaction).toBeInstanceOf(AssetMintTransaction);
    expect(transferAction.transaction).toBeInstanceOf(AssetTransferTransaction);

    mintParcel = mintParcel!;
    transferParcel = transferParcel!;
    const mintActionInstance = await ActionModel.createAction(mintParcel.hash(), mintAction, {
        invoice: null,
        errorType: null
    });
    const transferActionInstance = await ActionModel.createAction(transferParcel.hash(), transferAction, {
        invoice: null,
        errorType: null
    });
    const mintActionDoc = mintActionInstance.get({ plain: true });
    const transferActionDoc = transferActionInstance.get({ plain: true });

    expect(mintActionDoc.action).toEqual("assetTransaction");
    expect(transferActionDoc.action).toEqual("assetTransaction");

    done();
});

test("Get block docuemnt containing parcel, action", async done => {
    const savedTransfterBlockResponse = await BlockModel.getByNumber(bestBlockNumber);
    expect(savedTransfterBlockResponse).toBeTruthy();

    const savedBlock = savedTransfterBlockResponse!;
    const savedBlockDoc = savedBlock.get({ plain: true });

    expect(savedBlockDoc.hash).toEqual(transferBlock.hash.value);

    expect(savedBlockDoc.parcel).toBeTruthy();
    expect(savedBlockDoc.parcel![0].hash).toEqual(transferParcel.hash().value);

    expect(savedBlockDoc.parcel![0].action).toBeTruthy();
    expect(savedBlockDoc.parcel![0].action!.action).toEqual("assetTransaction");

    done();
});
