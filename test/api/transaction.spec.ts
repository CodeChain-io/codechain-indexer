import * as bodyParser from "body-parser";
import * as express from "express";
import * as sinon from "sinon";
import * as request from "supertest";

import { AssetTransferAddress, H256 } from "codechain-primitives/lib";
import { MintAsset } from "codechain-sdk/lib/core/classes";

import { IndexerContext } from "../../src/context";
import models from "../../src/models";
import { getNumberOfTransactions } from "../../src/models/logic/transaction";
import { createServer } from "../../src/server";
import * as Helper from "../helper";

let aliceAddress: AssetTransferAddress;
let bobAddress: string;
let mintRubyTx: MintAsset;
let mintEmeraldTx: MintAsset;
let transferTxHash: H256;
let initialTxCount: number;
beforeAll(async done => {
    await Helper.resetDb();
    await Helper.runExample("import-test-account");
    await Helper.worker.sync();

    initialTxCount = await getNumberOfTransactions({});
    const shardId = 0;
    aliceAddress = await Helper.sdk.key.createAssetTransferAddress();
    bobAddress = "tcaqyqckq0zgdxgpck6tjdg4qmp52p2vx3qaexqnegylk";

    const rubyAssetScheme = await Helper.sdk.core.createAssetScheme({
        shardId,
        metadata: JSON.stringify({
            name: "RubyTx",
            description: "An asset example",
            icon_url: "https://www.w3schools.com/tags/smiley.gif"
        }),
        supply: 10000
    });
    const emeraldAssetScheme = await Helper.sdk.core.createAssetScheme({
        shardId,
        metadata: JSON.stringify({
            name: "EmeraldTx",
            description: "An asset example",
            icon_url: "https://www.w3schools.com/tags/smiley.gif"
        }),
        supply: 10000
    });

    mintRubyTx = await Helper.sdk.core.createMintAssetTransaction({
        scheme: rubyAssetScheme,
        recipient: aliceAddress
    });

    const firstRuby = mintRubyTx.getMintedAsset();
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
    await Helper.sdk.rpc.chain.sendTransaction(mintRubyTx, {
        account: Helper.ACCOUNT_ADDRESS,
        passphrase: Helper.ACCOUNT_PASSPHRASE
    });
    transferTxHash = await Helper.sdk.rpc.chain.sendTransaction(transferTx, {
        account: Helper.ACCOUNT_ADDRESS,
        passphrase: Helper.ACCOUNT_PASSPHRASE
    });

    await Helper.sdk.rpc.devel.stopSealing();
    mintEmeraldTx = await Helper.sdk.core.createMintAssetTransaction({
        scheme: emeraldAssetScheme,
        recipient: aliceAddress
    });

    mintEmeraldTx.getMintedAsset();
    await Helper.sdk.rpc.chain.sendTransaction(mintEmeraldTx, {
        account: Helper.ACCOUNT_ADDRESS,
        passphrase: Helper.ACCOUNT_PASSPHRASE
    });

    await Helper.worker.sync();
    done();
}, 30 * 1000);

afterAll(async done => {
    await Helper.sdk.rpc.devel.startSealing();
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
    "api /tx",
    done => {
        request(app)
            .get("/api/tx")
            .expect(200, done);
    },
    30 * 1000
);

test(
    "api /tx rpc fail",
    async done => {
        const getBestBlockNumberStub = sinon.stub(
            context.sdk.rpc.chain,
            "getBestBlockNumber"
        );
        getBestBlockNumberStub.rejects(Error("ECONNREFUSED"));
        await request(app)
            .get("/api/tx?sync=true")
            .expect(503);
        await request(app)
            .get("/api/tx?sync=false")
            .expect(200);
        await request(app)
            .get("/api/tx?sync=true")
            .expect(503);
        getBestBlockNumberStub.restore();
        done();
    },
    30 * 1000
);

test(
    "api /tx with args",
    async done => {
        const assetType = mintRubyTx.getMintedAsset().assetType;
        const tracker = mintRubyTx.tracker().value;
        request(app)
            .get(
                `/api/tx?assetType=${assetType}&tracker=${tracker}&type=mintAsset`
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
    "api /tx/count",
    done => {
        request(app)
            .get("/api/tx/count")
            .expect(200)
            .expect(res => expect(Number(res.text)).toBe(initialTxCount + 2))
            .end(done);
    },
    30 * 1000
);

test(
    "api /tx/count with args",
    done => {
        const assetType = mintRubyTx.getMintedAsset().assetType;
        const tracker = mintRubyTx.tracker().value;

        request(app)
            .get(
                `/api/tx/count?assetType=${assetType}&tracker=${tracker}&type=mintAsset`
            )
            .expect(200)
            .expect(res => expect(res.text).toBe("1"))
            .end(done);
    },
    30 * 1000
);

test("api /tx/{hash}", done => {
    request(app)
        .get(`/api/tx/${transferTxHash}`)
        .expect(200, done);
});

test("api /pending-tx", done => {
    request(app)
        .get(`/api/pending-tx`)
        .expect(200, done);
});

test("api /pending-tx with args", done => {
    const address = aliceAddress.value;
    const assetType = mintEmeraldTx.getMintedAsset().assetType;
    request(app)
        .get(
            `/api/pending-tx?address=${address}&assetType=${assetType}&type=mintAsset`
        )
        .expect(200, done);
});

test("api /pending-tx/count", done => {
    request(app)
        .get(`/api/pending-tx/count`)
        .expect(200)
        .expect(res => expect(res.text).toBe("1"))
        .end(done);
});

test("api /pending-tx/count with args", done => {
    const address = aliceAddress.value;
    const assetType = mintEmeraldTx.getMintedAsset().assetType;
    request(app)
        .get(
            `/api/pending-tx/count?address=${address}&assetType=${assetType}&type=mintAsset`
        )
        .expect(200)
        .expect(res => expect(res.text).toBe("1"))
        .end(done);
});
