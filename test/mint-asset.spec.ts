import { U64 } from "codechain-primitives";

import models from "../src/models";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.runExample("import-test-account");
    done();
});

test("MintAsset", async () => {
    const scheme = Helper.sdk.core.createAssetScheme({
        shardId: 0,
        // NOTE: The random number prevents a conflict of assetType
        metadata: "" + Math.random(),
        supply: 1
    });
    const recipient = await Helper.sdk.key.createAssetTransferAddress();
    const { block } = await Helper.sendTransactionAndGetBlock(
        Helper.sdk.core.createMintAssetTransaction({
            scheme,
            recipient
        })
    );
    await BlockModel.createBlock(block, Helper.sdk, new U64(1), {});
});

afterAll(async done => {
    await models.sequelize.close();
    done();
});
