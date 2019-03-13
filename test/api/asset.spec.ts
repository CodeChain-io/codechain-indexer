import * as bodyParser from "body-parser";
import * as express from "express";
import * as request from "supertest";

import {
    AssetTransferAddress,
    MintAsset
} from "codechain-sdk/lib/core/classes";

import { IndexerContext } from "../../src/context";
import models from "../../src/models";
import { getCountOfAggsUTXO } from "../../src/models/logic/utxo";
import { createServer } from "../../src/server";
import * as Helper from "../helper";

let bobAddress: string;
let aliceAddress: AssetTransferAddress;
let mintTx: MintAsset;
let initialAggsUTXOCount: number;
beforeAll(async done => {
    await Helper.resetDb();
    await Helper.runExample("import-test-account");
    await Helper.worker.sync();

    initialAggsUTXOCount = await getCountOfAggsUTXO({});
    const shardId = 0;
    aliceAddress = await Helper.sdk.key.createAssetTransferAddress();
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
    await Helper.sdk.rpc.chain.sendTransaction(mintTx, {
        account: Helper.ACCOUNT_ADDRESS,
        passphrase: Helper.ACCOUNT_PASSPHRASE
    });
    await Helper.sdk.rpc.chain.sendTransaction(transferTx, {
        account: Helper.ACCOUNT_ADDRESS,
        passphrase: Helper.ACCOUNT_PASSPHRASE
    });

    await Helper.worker.sync();
    done();
}, 30 * 1000);

afterAll(async done => {
    models.sequelize.close();
    done();
}, 30 * 1000);

let context: IndexerContext;
let app: express.Express;

beforeAll(async done => {
    const config = require("config");
    context = IndexerContext.newInstance(config);
    app = express().use(bodyParser.json(), createServer(context));
    done();
}, 30 * 1000);

test(
    "api /utxo",
    async done => {
        request(app)
            .get("/api/utxo")
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /utxo with args",
    async done => {
        const address = aliceAddress;
        const assetType = mintTx.getMintedAsset().assetType;
        request(app)
            .get(
                `/api/utxo?address=${address}&assetType=${assetType}&onlyConfirmed=true&confirmThreshold=0`
            )
            .expect(200)
            .expect(res =>
                expect(Object.keys(JSON.parse(res.text)).length).toBe(1)
            )
            .end(done);
    },
    30 * 1000
);

test(
    "api /asset-scheme/{assetType}",
    async done => {
        const assetType = mintTx.getMintedAsset().assetType;
        request(app)
            .get(`/api/asset-scheme/${assetType}`)
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /asset-image/{assetType}",
    async done => {
        const assetType = mintTx.getMintedAsset().assetType;
        request(app)
            .get(`/api/asset-image/${assetType}`)
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /aggs-utxo",
    done => {
        request(app)
            .get("/api/aggs-utxo")
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /aggs-utxo with args",
    done => {
        const address = bobAddress;
        const assetType = mintTx.getMintedAsset().assetType;
        request(app)
            .get(
                `/api/aggs-utxo?address=${address}&assetType=${assetType}&page=1&itemsPerPage=1&onlyConfirmed=true&confirmThreshold=0&sync=true`
            )
            .expect(200)
            .expect(res =>
                expect(Object.keys(JSON.parse(res.text)).length).toBe(1)
            )
            .end(done);
    },
    30 * 1000
);

test(
    "api /aggs-utxo/count",
    done => {
        request(app)
            .get("/api/aggs-utxo/count")
            .expect(200)
            .expect(res =>
                expect(Number(res.text)).toBe(initialAggsUTXOCount + 1)
            )
            .end(done);
    },
    30 * 1000
);

test(
    "api /aggs-utxo/count with args",
    done => {
        const address = bobAddress;
        const assetType = mintTx.getMintedAsset().assetType;
        request(app)
            .get(
                `/api/aggs-utxo/count?address=${address}&assetType=${assetType}&onlyConfirmed=true&confirmThreshold=0&sync=true`
            )
            .expect(200)
            .expect(res => expect(res.text).toBe("1"))
            .end(done);
    },
    30 * 1000
);

test(
    "api /snapshot",
    done => {
        const assetType = mintTx.getMintedAsset().assetType;
        const date = "2019-03-11";
        request(app)
            .get(`/api/snapshot?assetType=${assetType}&date=${date}`)
            .expect(200, done);
    },
    30 * 1000
);
