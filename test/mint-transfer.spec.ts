import { expect } from "chai";
import { Block, MintAsset, U64 } from "codechain-sdk/lib/core/classes";
import { TransferAssetActionJSON } from "codechain-sdk/lib/core/transaction/TransferAsset";
import "mocha";
import * as AssetSchemeModel from "../src/models/logic/assetscheme";
import * as AssetTransferOutputModel from "../src/models/logic/assettransferoutput";
import * as BlockModel from "../src/models/logic/block";
import * as TransactionModel from "../src/models/logic/transaction";
import * as UTXOModel from "../src/models/logic/utxo";
import * as Helper from "./helper";

describe("mint-transfer", function() {
    let mintBlock: Block;
    let transferBlock: Block;

    before(async function() {
        await Helper.runExample("import-test-account");
        await Helper.runExample("mint-and-transfer");
        const bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        mintBlock = (await Helper.sdk.rpc.chain.getBlock(bestBlockNumber - 1))!;
        transferBlock = (await Helper.sdk.rpc.chain.getBlock(bestBlockNumber))!;
    });

    it("mint and transfer", async function() {
        await check(mintBlock, "mintAsset");
        await check(transferBlock, "transferAsset");
    });
});

describe("mint-transfer-synchronized", function() {
    let bestBlockNumber: number;
    let mintBlock: Block;
    let transferBlock: Block;

    before(async function() {
        await Helper.runExample("import-test-account");
        await Helper.runExample("mint-and-transfer");
        bestBlockNumber = await Helper.sdk.rpc.chain.getBestBlockNumber();
        mintBlock = (await Helper.sdk.rpc.chain.getBlock(bestBlockNumber - 1))!;
        transferBlock = (await Helper.sdk.rpc.chain.getBlock(bestBlockNumber))!;
        await Helper.worker.sync();
    });

    it("Check duplicated block", async function() {
        expect(transferBlock).not.null;

        // Duplicated error test
        try {
            await BlockModel.createBlock(
                transferBlock,
                Helper.sdk,
                new U64("1000")
            );
            expect.fail();
        } catch (e) {
            expect(e).not.null;
            expect(e.message).equal("AlreadyExist");
        }
    });

    it("Check assetScheme", async function() {
        const signed = mintBlock.transactions[0];
        expect(mintBlock).not.null;
        const assetType = (signed.unsigned as MintAsset).getAssetType();
        const assetSchemeInstance = (await AssetSchemeModel.getByAssetType(
            assetType
        ))!;
        expect(assetSchemeInstance).not.null;

        const assetScheme = assetSchemeInstance.get({ plain: true });

        expect(assetScheme.transactionHash).equal(signed.hash().value);
    });

    it("Check assetTransfer output", async function() {
        const signed = transferBlock.transactions[0];
        const transferOutputInst = await AssetTransferOutputModel.getByTransactionHash(
            signed.hash().value
        );
        const { outputs } = signed.toJSON().action as TransferAssetActionJSON;
        expect(transferOutputInst.length).equal(outputs.length);
    });

    it("Check utxo", async function() {
        const mintHash = mintBlock.transactions[0].hash();
        const txInst = (await TransactionModel.getByHash(mintHash))!;

        const transferHash = transferBlock.transactions[0].hash().value;
        const transferOutputInst = await AssetTransferOutputModel.getByTransactionHash(
            transferHash
        );

        expect(await txInst.get("type")).equal("mintAsset");
        const mintOwner = (await txInst.getMintAsset())!.get("recipient");
        console.log("mint owner", mintOwner);
        const utxoOfMintOwner = await UTXOModel.getByAddress(mintOwner);
        const utxoOfMintAssetInst = await UTXOModel.getByTxHashIndex(
            mintHash,
            0
        );

        expect(utxoOfMintOwner.length).equal(1);
        expect(utxoOfMintAssetInst!.get().usedTransactionHash).not.null;

        const firstOutputOwner = transferOutputInst[0].get("owner");
        const UTXOInst = await UTXOModel.getByAddress(firstOutputOwner!);
        expect(UTXOInst.length).not.equal(0);
    });

    it("Get block document containing action, transaction, input", async function() {
        const mintBlockInst = (await BlockModel.getByNumber(
            bestBlockNumber - 1
        ))!;
        expect(mintBlockInst).not.null;
        expect(mintBlockInst.get({ plain: true }).hash).equal(
            mintBlock.hash.value
        );
        const mintBlockTransactions = await TransactionModel.getTransactions({
            blockNumber: bestBlockNumber - 1,
            page: 1,
            itemsPerPage: 15
        }).then(txs => txs.map(tx => tx.get({ plain: true })));
        expect(mintBlockTransactions[0].hash).equal(
            mintBlock.transactions[0].hash().value
        );
        expect(mintBlockTransactions[0].type).equal("mintAsset");

        const transferBlockInst = (await BlockModel.getByNumber(
            bestBlockNumber
        ))!;
        expect(transferBlockInst).not.null;
        expect(transferBlockInst.get({ plain: true }).hash).equal(
            transferBlock.hash.value
        );
        const transferBlockTransactions = await TransactionModel.getTransactions(
            {
                blockNumber: bestBlockNumber,
                page: 1,
                itemsPerPage: 15
            }
        ).then(txs => txs.map(tx => tx.get({ plain: true })));
        expect(transferBlockTransactions[0].hash).equal(
            transferBlock.transactions[0].hash().value
        );
        expect(transferBlockTransactions[0].type).equal("transferAsset");
        expect(transferBlockTransactions[0].transferAsset!.inputs).not.null;
        expect(transferBlockTransactions[0].transferAsset!.outputs).not.null;
        expect(transferBlockTransactions[0].transferAsset!.inputs.length).equal(
            (transferBlock.transactions[0].unsigned.toJSON()
                .action as TransferAssetActionJSON).inputs.length
        );
        expect(
            transferBlockTransactions[0].transferAsset!.outputs.length
        ).equal(
            (transferBlock.transactions[0].unsigned.toJSON()
                .action as TransferAssetActionJSON).outputs.length
        );
    });
});

async function check(blockResponse: Block, type: string) {
    expect(blockResponse).not.null;

    const blockInst = await BlockModel.createBlock(
        blockResponse,
        Helper.sdk,
        new U64("1000")
    );
    const blockDoc = blockInst.get({ plain: true });
    expect(blockDoc.hash).equal(blockResponse.hash.value);

    const signed = blockResponse.transactions[0];
    expect(signed).not.null;
    const txByHashInst = (await TransactionModel.getByHash(signed.hash()))!;
    expect(txByHashInst).not.null;
    const tx = txByHashInst.get({ plain: true });
    expect(tx.hash).equal(signed.hash().value);
    expect(tx.type).equal(type);
    expect(tx.tracker).equal((signed.unsigned as any).tracker().value);
}
