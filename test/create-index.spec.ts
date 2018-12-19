import { U64 } from "codechain-primitives/lib";
import models from "../src/models";
import * as BlockModel from "../src/models/logic/block";
import * as ParcelModel from "../src/models/logic/parcel";
import * as Helper from "./helper";

beforeEach(async done => {
    await Helper.runExample("import-test-account");
    await Helper.runExample("mint-and-transfer");
    done();
});

afterAll(async done => {
    await Helper.db.end();
    await models.sequelize.close();
    done();
});

test("Create new block", async done => {
    const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    let block = await Helper.sdk.rpc.chain.getBlock(bestBlockNumber);
    expect(block).toBeTruthy();

    block = block!;
    const blockInstance = await BlockModel.createBlock(block, new U64("1000"));
    const blockDoc = blockInstance.get({ plain: true });
    expect(blockDoc.hash).toEqual(block.hash.value);

    let error: Error | null = null;
    try {
        await BlockModel.createBlock(block, new U64("1000"));
    } catch (e) {
        error = e;
    }
    expect(error).toBeTruthy();

    error = error!;
    expect(error.message).toEqual("AlreadyExist");

    done();
});

test("Create new parcel", async done => {
    const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
    let block = await Helper.sdk.rpc.chain.getBlock(bestBlockNumber);
    expect(block).toBeTruthy();

    block = block!;
    const blockInstance = await BlockModel.createBlock(block, new U64("1000"));
    const blockDoc = blockInstance.get({ plain: true });
    expect(blockDoc.hash).toEqual(block.hash.value);

    let parcel = block.parcels[0];
    expect(parcel).toBeTruthy();

    parcel = parcel!;
    const parcelInstance = await ParcelModel.createParcel(parcel);
    const parcelDoc = parcelInstance.get({ plain: true });
    expect(parcelDoc.hash).toEqual(parcel.hash().value);

    done();
});
