import * as bodyParser from "body-parser";
import * as express from "express";
import * as request from "supertest";

import { MintAsset } from "codechain-sdk/lib/core/classes";

import { IndexerContext } from "../../src/context";
import models from "../../src/models";
import { createServer } from "../../src/server";
import * as Helper from "../helper";

let bobAddress: string;
let mintTx: MintAsset;
beforeAll(async done => {
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
    done();
}, 30 * 1000);

afterAll(async done => {
    await models.sequelize.close();
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
    "api /block/latest",
    done => {
        request(app)
            .get("/api/block/latest")
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /block/count",
    done => {
        request(app)
            .get("/api/block/count")
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /block/count with args",
    done => {
        const address = bobAddress;
        request(app)
            .get(`/api/block/count?address=${address}`)
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /block/{hashOrNumber}",
    done => {
        const hash =
            "d9c2a05f4f1e53634f1f68a3560d419b53e1900c2e85ae77f0abf97954d9b66d";
        request(app)
            .get(`/api/block/${hash}`)
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /block/{hashOrNumber}",
    done => {
        const num = 1;
        request(app)
            .get(`/api/block/${num}`)
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /block",
    done => {
        request(app)
            .get(`/api/block`)
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /block with args",
    done => {
        const address = "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhhn9p3";

        request(app)
            .get(`/api/block?address=${address}`)
            .expect(200, done);
    },
    30 * 1000
);
