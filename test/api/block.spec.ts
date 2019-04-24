import * as bodyParser from "body-parser";
import * as express from "express";
import "mocha";
import * as request from "supertest";

import { MintAsset } from "codechain-sdk/lib/core/classes";

import { IndexerContext } from "../../src/context";
import { createServer } from "../../src/server";
import * as Helper from "../helper";

describe("block-api", function() {
    let bobAddress: string;
    let mintTx: MintAsset;

    let context: IndexerContext;
    let app: express.Express;

    before(async function() {
        await Helper.resetDb();
        await Helper.runExample("import-test-account");
        await Helper.worker.sync();

        const shardId = 0;
        const aliceAddress = await Helper.sdk.key.createAssetAddress();
        bobAddress = "tcaqyqckq0zgdxgpck6tjdg4qmp52p2vx3qaexqnegylk";

        const rubyAssetScheme = await Helper.sdk.core.createAssetScheme({
            shardId,
            metadata: JSON.stringify({
                name: "RubyBlock",
                description: "An asset example",
                icon_url: "https://www.w3schools.com/tags/smiley.gif"
            }),
            supply: 10000
        });
        mintTx = await Helper.sdk.core.createMintAssetTransaction({
            scheme: rubyAssetScheme,
            recipient: aliceAddress
        });

        const firstRuby = mintTx.getMintedAsset();
        const transferTx = await Helper.sdk.core
            .createTransferAssetTransaction()
            .addInputs(firstRuby)
            .addOutputs(
                {
                    recipient: bobAddress,
                    quantity: 1000,
                    assetType: firstRuby.assetType,
                    shardId
                },
                {
                    recipient: bobAddress,
                    quantity: 2000,
                    assetType: firstRuby.assetType,
                    shardId
                },
                {
                    recipient: aliceAddress,
                    quantity: 7000,
                    assetType: firstRuby.assetType,
                    shardId
                }
            );
        await Helper.sdk.key.signTransactionInput(transferTx, 0);
        await Helper.sdk.rpc.chain.sendTransaction(mintTx, {
            account: Helper.ACCOUNT_ADDRESS,
            passphrase: Helper.ACCOUNT_PASSPHRASE
        });
        await Helper.sdk.rpc.chain.sendTransaction(transferTx, {
            account: Helper.ACCOUNT_ADDRESS,
            passphrase: Helper.ACCOUNT_PASSPHRASE
        });

        await Helper.worker.sync();

        const config = require("config");
        context = IndexerContext.newInstance(config);
        app = express().use(bodyParser.json(), createServer(context));
    });

    it("api /block/latest", async function() {
        await request(app)
            .get("/api/block/latest")
            .expect(200);
    });

    it("api /block/count", async function() {
        await request(app)
            .get("/api/block/count")
            .expect(200);
    });

    it("api /block/count with args", async function() {
        const address = bobAddress;
        await request(app)
            .get(`/api/block/count?address=${address}`)
            .expect(200);
    });

    it("api /block/{hashOrNumber}", async function() {
        const hash =
            "d9c2a05f4f1e53634f1f68a3560d419b53e1900c2e85ae77f0abf97954d9b66d";
        await request(app)
            .get(`/api/block/${hash}`)
            .expect(200);
    });

    it("api /block/{hashOrNumber}", async function() {
        const num = 1;
        await request(app)
            .get(`/api/block/${num}`)
            .expect(200);
    });

    it("api /block", async function() {
        await request(app)
            .get(`/api/block`)
            .expect(200);
    });

    it("api /block with args", async function() {
        const address = "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhhn9p3";
        await request(app)
            .get(`/api/block?address=${address}`)
            .expect(200);
    });
});
