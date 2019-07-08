import * as http from "http";
import { run as runChecker } from "./checker";
import { IndexerConfig } from "./config";
import { IndexerContext } from "./context";
import log from "./log";
import { createServer } from "./server";

async function runServer() {
    process.env.NODE_ENV = process.env.NODE_ENV || "dev";
    const options = require("config") as IndexerConfig;
    const context = IndexerContext.newInstance(options);

    const rpcNetworkId = await context.sdk.rpc.chain
        .getNetworkId()
        .catch(() => "unavailable");
    if (rpcNetworkId !== options.codechain.networkId) {
        console.error("Error: The network ID does not match.");
        console.error(`- Your configuration: ${options.codechain.networkId}`);
        console.error(
            `- Response from ${options.codechain.host}: ${rpcNetworkId}`
        );
        console.error("Aborted.");
        return;
    }

    process.on("SIGINT", async () => {
        console.log("Caught interrupt signal.");
        await context.destroy();
        process.exit();
    });
    const app = createServer(context);

    const httpServer = http.createServer(app);
    httpServer.listen(options.httpPort, () => {
        log.info(
            `HTTP server is listening on ${options.httpPort} in ${
                process.env.NODE_ENV
            } mode`
        );
    });
    context.worker.run();

    if (process.env.ENABLE_CCC_CHANGES_CHECK) {
        runChecker(context.sdk).catch(console.error);
    }
}

runServer();
