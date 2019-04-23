import { H160, H256, U64 } from "codechain-primitives";
import { MintAsset } from "codechain-sdk/lib/core/classes";
import "mocha";

import * as BlockModel from "../src/models/logic/block";
import * as Helper from "./helper";

describe("transfer-asset", function() {
    before(async function() {
        await Helper.runExample("import-test-account");
    });

    let mintAsset: MintAsset;

    beforeEach(async function() {
        mintAsset = (await Helper.mintAsset()).transaction;
    });

    it("TransferAsset - success", async function() {
        const asset = mintAsset.getMintedAsset();
        const transferAsset = Helper.sdk.core.createTransferAssetTransaction();
        transferAsset.addInputs(asset);
        const recipient = await Helper.sdk.key.createAssetAddress();
        transferAsset.addOutputs({
            quantity: asset.quantity,
            assetType: asset.assetType,
            shardId: 0,
            recipient
        });
        await Helper.sdk.key.signTransactionInput(transferAsset, 0);
        const { block } = await Helper.sendTransactionAndGetBlock(
            transferAsset
        );
        await BlockModel.createBlock(block, Helper.sdk, new U64(1));
    });

    it.skip("TransferAsset - Nonexistent assetType", async function() {
        const assetType = new H160("0000000000000000000000000000000000123456");
        const asset = mintAsset.getMintedAsset();
        const transferAsset = Helper.sdk.core.createTransferAssetTransaction();
        const input = Helper.sdk.core.createAssetTransferInput({
            assetOutPoint: {
                tracker: asset.outPoint.tracker,
                index: asset.outPoint.index,
                assetType,
                shardId: asset.shardId,
                quantity: asset.quantity,
                lockScriptHash: asset.outPoint.lockScriptHash,
                parameters: asset.outPoint.parameters
            }
        });
        transferAsset.addInputs(input);
        const recipient = await Helper.sdk.key.createAssetAddress();
        transferAsset.addOutputs({
            quantity: asset.quantity,
            assetType,
            shardId: asset.shardId,
            recipient
        });
        await Helper.sdk.key.signTransactionInput(transferAsset, 0);
        const { block } = await Helper.sendTransactionAndGetBlock(
            transferAsset
        );
        await BlockModel.createBlock(block, Helper.sdk, new U64(1));
    });

    it.skip("TransferAsset - Nonexistent outPoint index", async function() {
        const asset = mintAsset.getMintedAsset();
        const transferAsset = Helper.sdk.core.createTransferAssetTransaction();
        const input = Helper.sdk.core.createAssetTransferInput({
            assetOutPoint: {
                tracker: asset.outPoint.tracker,
                index: asset.outPoint.index + 1,
                assetType: asset.assetType,
                shardId: asset.shardId,
                quantity: asset.quantity,
                lockScriptHash: asset.outPoint.lockScriptHash,
                parameters: asset.outPoint.parameters
            }
        });
        transferAsset.addInputs(input);
        const recipient = await Helper.sdk.key.createAssetAddress();
        transferAsset.addOutputs({
            quantity: asset.quantity,
            assetType: asset.assetType,
            shardId: asset.shardId,
            recipient
        });
        await Helper.sdk.key.signTransactionInput(transferAsset, 0);
        const { block } = await Helper.sendTransactionAndGetBlock(
            transferAsset
        );
        await BlockModel.createBlock(block, Helper.sdk, new U64(1));
    });

    it.skip("TransferAsset - Nonexistent outPoint index", async function() {
        const tracker = new H256(
            "0000000000000000000000000000000000000000000000000000000000123456"
        );
        const asset = mintAsset.getMintedAsset();
        const transferAsset = Helper.sdk.core.createTransferAssetTransaction();
        const input = Helper.sdk.core.createAssetTransferInput({
            assetOutPoint: {
                tracker,
                index: asset.outPoint.index,
                assetType: asset.assetType,
                shardId: asset.shardId,
                quantity: asset.quantity,
                lockScriptHash: asset.outPoint.lockScriptHash,
                parameters: asset.outPoint.parameters
            }
        });
        transferAsset.addInputs(input);
        const recipient = await Helper.sdk.key.createAssetAddress();
        transferAsset.addOutputs({
            quantity: asset.quantity,
            assetType: asset.assetType,
            shardId: asset.shardId,
            recipient
        });
        await Helper.sdk.key.signTransactionInput(transferAsset, 0);
        const { block } = await Helper.sendTransactionAndGetBlock(
            transferAsset
        );
        await BlockModel.createBlock(block, Helper.sdk, new U64(1));
    });
});
