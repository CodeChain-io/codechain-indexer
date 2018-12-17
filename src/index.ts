import { SDK } from "codechain-sdk";
import BlockSyncer from "./block-syncer";
import DbClient from "./db";
import Server from "./server";

interface IndexerConfig {
    codechain: {
        host: string;
        networkId: "cc" | "tc" | "sc" | "wc";
    };
    dbHost: string;
    serverPort: number;
}
class Indexer {
    private config: IndexerConfig;
    private sdk: SDK;
    private blockSyncer: BlockSyncer;
    private db: DbClient;
    private server: Server;
    constructor(config: IndexerConfig) {
        this.config = config;
        this.sdk = new SDK({ server: this.config.codechain.host, networkId: this.config.codechain.networkId });
        this.db = new DbClient(this.config.dbHost);
        this.blockSyncer = new BlockSyncer({ sdk: this.sdk, db: this.db });
        this.server = new Server(
            { sdk: this.sdk, blockSyncer: this.blockSyncer, db: this.db },
            { httpPort: this.config.serverPort }
        );
    }
    public run() {
        this.blockSyncer.run();
        this.server.run();
    }
}

const indexer = new Indexer({
    codechain: {
        host: "",
        networkId: "tc"
    },
    dbHost: "",
    serverPort: 5000
});

indexer.run();
