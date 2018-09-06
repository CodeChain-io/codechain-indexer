import { BlockSyncWorker } from "./BlockSyncWorker";
import config from "./config";

export interface WorkerConfig {
    elasticSearch: {
        host: string;
    };
    codeChain: {
        host: string;
    };
    cron: {
        blockWatch: string;
    };
    miningReward: {
        solo: number;
        husky: number;
    };
    genesisAddressList: {
        solo: string[];
        husky: string[];
    };
}

const app = () => {
    const worker = new BlockSyncWorker(config);
    worker.start();
};

app();
