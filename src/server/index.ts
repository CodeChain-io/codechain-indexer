import * as http from "http";

import * as bodyParser from "body-parser";
import * as express from "express";

import { SDK } from "codechain-sdk";
import BlockSyncer from "../block-syncer";
import DbClient from "../db";
import { ServerConfig } from "./";
import { createApiRouter } from "./api";

export interface ServerConfig {
    httpPort: number;
}

export interface ServerContext {
    db: DbClient;
    sdk: SDK;
    blockSyncer: BlockSyncer;
}

export default class Server {
    private context: ServerContext;
    private config: ServerConfig;
    constructor(context: ServerContext, config: ServerConfig) {
        this.context = context;
        this.config = config;
    }

    public run = () => {
        const app = express();

        // Enable reverse proxy support in Express. This causes the
        // the "X-Forwarded-Proto" header field to be trusted so its
        // value can be used to determine the protocol. See
        // http://expressjs.com/api#app-settings for more details.
        app.enable("trust proxy");
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(
            bodyParser.json({
                type: () => true // Treat all other content types as application/json
            })
        );
        app.use("/api", createApiRouter(this.context, true));
        const httpServer = http.createServer(app);
        httpServer.listen(this.config.httpPort, () => {
            console.log(`listening on port ${this.config.httpPort}`);
        });
    };
}
