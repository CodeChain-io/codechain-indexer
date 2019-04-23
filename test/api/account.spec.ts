import * as bodyParser from "body-parser";
import { expect } from "chai";
import * as express from "express";
import "mocha";
import * as request from "supertest";

import { MintAsset } from "codechain-sdk/lib/core/classes";

import { IndexerContext } from "../../src/context";
import { createServer } from "../../src/server";
import * as Helper from "../helper";

describe("account-api", function() {
    let bobAddress: string;
    let mintTx: MintAsset;

    let context: IndexerContext;
    let app: express.Express;

    before(async function() {
        this.timeout("30s");

        await Helper.resetDb();
        await Helper.runExample("import-test-account");
        await Helper.worker.sync();

        const shardId = 0;
        const aliceAddress = await Helper.sdk.key.createAssetAddress();
        bobAddress = "tcaqyqckq0zgdxgpck6tjdg4qmp52p2vx3qaexqnegylk";

        const rubyAssetScheme = await Helper.sdk.core.createAssetScheme({
            shardId,
            metadata: JSON.stringify({
                name: "RubyAccount",
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

    it("api /account", async function() {
        this.timeout("30s");
        await request(app)
            .get("/api/account")
            .expect(200);
    });

    it("api /account with args", async function() {
        this.timeout("30s");
        const itemsPerPage = 2;
        await request(app)
            .get(`/api/account?page=1&itemsPerPage=${itemsPerPage}`)
            .expect(200)
            .expect(res =>
                expect(Object.keys(JSON.parse(res.text)).length).equal(
                    itemsPerPage
                )
            );
    });

    it("api /account/count", async function() {
        this.timeout("30s");
        await request(app)
            .get("/api/account/count")
            .expect(200);
    });

    it("api /account/{address}", async function() {
        this.timeout("30s");
        const address = "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqungah99";
        await request(app)
            .get(`/api/account/${address}`)
            .expect(200)
            .expect(res => expect(res).not.be.null);
    });
});
