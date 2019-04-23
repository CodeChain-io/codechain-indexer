import { U64 } from "codechain-primitives";
import "mocha";
import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

describe("mint-asset", function() {
    before(async function() {
        await Helper.runExample("import-test-account");
        await Helper.worker.sync();
    });

    it("MintAsset", async function() {
        const scheme = Helper.sdk.core.createAssetScheme({
            shardId: 0,
            // NOTE: The random number prevents a conflict of assetType
            metadata: "" + Math.random(),
            supply: 1
        });
        const recipient = await Helper.sdk.key.createAssetAddress();
        const { block } = await Helper.sendTransactionAndGetBlock(
            Helper.sdk.core.createMintAssetTransaction({
                scheme,
                recipient
            })
        );
        await BlockModel.createBlock(block, Helper.sdk, new U64(1));
    });
});
