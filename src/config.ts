import * as pg from "pg";

export interface IndexerConfig {
    version: number;
    publicAddress: string;
    httpPort: number;
    codechain: {
        host: string;
        networkId: "cc" | "tc" | "sc" | "wc";
    };
    pg: pg.ConnectionConfig;
    sequelize: {
        dialect: string;
        operatorsAliases: boolean;
    };
    worker: {
        watchSchedule: string;
    };
}
