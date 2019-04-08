import * as bodyParser from "body-parser";
import * as express from "express";
import * as sinon from "sinon";
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
            name: "RubyStatus",
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
    "api /ping",
    done => {
        request(app)
            .get("/api/ping")
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /ping rpc fail",
    async done => {
        const pingStub = sinon.stub(context.sdk.rpc.node, "ping");
        pingStub.rejects(Error("ECONNREFUSED"));

        await request(app)
            .get("/api/ping")
            .expect(503);

        pingStub.restore();
        done();
    },
    30 * 1000
);

test(
    "api /status/codechain",
    done => {
        request(app)
            .get("/api/status/codechain")
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /status/codechain rpc fail",
    async done => {
        const pingStub = sinon.stub(context.sdk.rpc.node, "getNodeVersion");
        pingStub.rejects(Error("ECONNREFUSED"));
        await request(app)
            .get("/api/status/codechain")
            .expect(503);

        pingStub.restore();
        done();
    },
    30 * 1000
);

test(
    "api /status/sync",
    done => {
        request(app)
            .get("/api/status/sync")
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /status/sync rpc fail",
    async done => {
        const getBestBlockNumberStub = sinon.stub(
            context.sdk.rpc.chain,
            "getBestBlockNumber"
        );
        getBestBlockNumberStub.rejects(Error("ECONNREFUSED"));

        await request(app)
            .get("/api/status/sync")
            .expect(503);

        getBestBlockNumberStub.restore();
        done();
    },
    30 * 1000
);
