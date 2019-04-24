import * as bodyParser from "body-parser";
import { expect } from "chai";
import * as express from "express";
import "mocha";
import * as request from "supertest";

import { AssetAddress, MintAsset } from "codechain-sdk/lib/core/classes";

import { IndexerContext } from "../../src/context";
import { getCountOfAggsUTXO } from "../../src/models/logic/utxo";
import { createServer } from "../../src/server";
import * as Helper from "../helper";

describe("asset-api", function() {
    let bobAddress: string;
    let aliceAddress: AssetAddress;
    let mintTx: MintAsset;
    let initialAggsUTXOCount: number;

    let context: IndexerContext;
    let app: express.Express;

    before(async function() {
        await Helper.resetDb();
        await Helper.runExample("import-test-account");
        await Helper.worker.sync();

        initialAggsUTXOCount = await getCountOfAggsUTXO({});
        const shardId = 0;
        aliceAddress = await Helper.sdk.key.createAssetAddress();
        bobAddress = "tcaqyqckq0zgdxgpck6tjdg4qmp52p2vx3qaexqnegylk";

        const rubyAssetScheme = await Helper.sdk.core.createAssetScheme({
            shardId,
            metadata: JSON.stringify({
                name: "RubyAsset",
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
        const mintHash = await Helper.sdk.rpc.chain.sendTransaction(mintTx, {
            account: Helper.ACCOUNT_ADDRESS,
            passphrase: Helper.ACCOUNT_PASSPHRASE
        });
        const transferHash = await Helper.sdk.rpc.chain.sendTransaction(
            transferTx,
            {
                account: Helper.ACCOUNT_ADDRESS,
                passphrase: Helper.ACCOUNT_PASSPHRASE
            }
        );
        expect(Helper.sdk.rpc.chain.getTransaction(mintHash));
        expect(Helper.sdk.rpc.chain.getTransaction(transferHash));

        await Helper.worker.sync();

        const config = require("config");
        context = IndexerContext.newInstance(config);
        app = express().use(bodyParser.json(), createServer(context));
    });

    it("api /utxo", async function() {
        await request(app)
            .get("/api/utxo")
            .expect(200);
    });

    it("api /utxo with args", async function() {
        const address = aliceAddress;
        const assetType = mintTx.getMintedAsset().assetType;
        await request(app)
            .get(
                `/api/utxo?address=${address}&assetType=${assetType}&onlyConfirmed=true&confirmThreshold=0`
            )
            .expect(200)
            .expect(res =>
                expect(Object.keys(JSON.parse(res.text)).length).equal(1)
            );
    });

    it("api /asset-scheme/{assetType}", async function() {
        const assetType = mintTx.getMintedAsset().assetType;
        await request(app)
            .get(`/api/asset-scheme/${assetType}`)
            .expect(200);
    });

    it("api /asset-image/{assetType}", async function() {
        const assetType = mintTx.getMintedAsset().assetType;
        await request(app)
            .get(`/api/asset-image/${assetType}`)
            .expect(200);
    });

    it("api /aggs-utxo", async function() {
        await request(app)
            .get("/api/aggs-utxo")
            .expect(200);
    });

    it("api /aggs-utxo with args", async function() {
        const address = bobAddress;
        const assetType = mintTx.getMintedAsset().assetType;
        await request(app)
            .get(
                `/api/aggs-utxo?address=${address}&assetType=${assetType}&page=1&itemsPerPage=1&onlyConfirmed=true&confirmThreshold=0&sync=true`
            )
            .expect(200)
            .expect(res =>
                expect(Object.keys(JSON.parse(res.text)).length).equal(1)
            );
    });

    it("api /aggs-utxo/count", async function() {
        await request(app)
            .get("/api/aggs-utxo/count")
            .expect(200)
            .expect(res =>
                expect(Number(res.text)).equal(initialAggsUTXOCount + 1)
            );
    });

    it("api /aggs-utxo/count with args", async function() {
        const address = bobAddress;
        const assetType = mintTx.getMintedAsset().assetType;
        await request(app)
            .get(
                `/api/aggs-utxo/count?address=${address}&assetType=${assetType}&onlyConfirmed=true&confirmThreshold=0&sync=true`
            )
            .expect(200)
            .expect(res => expect(res.text).equal("1"));
    });

    it("api /snapshot", async function() {
        const assetType = mintTx.getMintedAsset().assetType;
        const date = "2019-03-11";
        await request(app)
            .get(`/api/snapshot?assetType=${assetType}&date=${date}`)
            .expect(200);
    });
});
