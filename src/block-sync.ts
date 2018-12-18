import { SDK } from "codechain-sdk";
import * as pg from "pg";

export default class BlockSync {
    public pg: pg.Pool;
    // private sdk: SDK;
    constructor(options: { sdk: SDK; pg: pg.Pool }) {
        this.pg = options.pg;
        // this.sdk = options.sdk;
        this.run();
    }
    public run = async () => {
        // nothing
    };
}
