import { SDK } from "codechain-sdk";
import * as pg from "pg";
import BlockSync from "./block-sync";
import { IndexerConfig } from "./config";
import models from "./models";

export class IndexerContext {
    public static newInstance(options: IndexerConfig) {
        const context = new IndexerContext(options);

        process.on("SIGINT", async () => {
            console.log("Caught interrupt signal. Destroying the context...");
            await context.destroy();
            process.exit();
        });

        return context;
    }
    public pg: pg.Pool;
    public sdk: SDK;
    public blockSyncer: BlockSync;

    private constructor(public readonly options: IndexerConfig) {
        this.pg = new pg.Pool(options.pg);
        this.sdk = new SDK({
            server: options.codechain.host,
            networkId: options.codechain.networkId
        });
        this.blockSyncer = new BlockSync({ sdk: this.sdk, pg: this.pg });
    }

    public destroy = async () => {
        await this.pg.end();
        await models.sequelize.close();
    };
}
