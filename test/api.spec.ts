import * as bodyParser from "body-parser";
import * as express from "express";
import * as request from "supertest";

import { IndexerContext } from "../src/context";
import models from "../src/models";
import { createServer } from "../src/server";

let app: express.Express;

beforeAll(async done => {
    const config = require("config");
    const context = IndexerContext.newInstance(config);
    app = express().use(bodyParser.json(), createServer(context));
    done();
});

afterAll(async done => {
    models.sequelize.close();
    done();
});

it("ping", done => {
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
