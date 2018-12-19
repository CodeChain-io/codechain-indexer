import * as http from "http";
import { IndexerConfig } from "./config";
import { IndexerContext } from "./context";
import log from "./log";
import { createServer } from "./server";

async function runServer() {
    process.env.NODE_ENV = process.env.NODE_ENV || "dev";
    const options = require("config") as IndexerConfig;
    const context = IndexerContext.newInstance(options);
    const app = createServer(context);

    const httpServer = http.createServer(app);
    httpServer.listen(options.httpPort, () => {
        log.info(`HTTP server is listening on ${options.httpPort} in ${process.env.NODE_ENV} mode`);
    });
}

runServer();
