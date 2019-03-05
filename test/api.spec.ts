import * as bodyParser from "body-parser";
import * as express from "express";
import * as sinon from "sinon";
import * as request from "supertest";

import { IndexerContext } from "../src/context";
import models from "../src/models";
import { createServer } from "../src/server";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.resetDb();
    done();
});

afterAll(async done => {
    models.sequelize.close();
    done();
});

let context: IndexerContext;
let app: express.Express;

beforeAll(async done => {
    const config = require("config");
    context = IndexerContext.newInstance(config);
    app = express().use(bodyParser.json(), createServer(context));
    done();
});

test("api ping", done => {
    request(app)
        .get("/api/ping")
        .expect(200)
        .end(err => {
            if (err) {
                throw err;
            }
            done();
        });
});

test("api ping rpc fail", async done => {
    const pingStub = sinon.stub(context.sdk.rpc.node, "ping");
    pingStub.rejects(Error("ECONNREFUSED"));

    await request(app)
        .get("/api/ping")
        .expect(503);

    pingStub.restore();
    done();
});

test("api tx", done => {
    request(app)
        .get("/api/tx")
        .expect(200)
        .end(err => {
            if (err) {
                throw err;
            }
            done();
        });
});

test("api tx rpc fail", async done => {
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
});

test("api sync", done => {
    request(app)
        .get("/api/status/sync")
        .expect(200)
        .end(err => {
            if (err) {
                throw err;
            }
            done();
        });
});

test("api sync rpc fail", async done => {
    const getBestBlockNumberStub = sinon.stub(
        context.sdk.rpc.chain,
        "getBestBlockNumber"
    );
    getBestBlockNumberStub.rejects(Error("ECONNREFUSED"));

    await request(app)
        .get("/api/status/sync")
        .expect(503);

    getBestBlockNumberStub.rejects();
    done();
});
