import { SDK } from "codechain-sdk";
import DbClient from "../db";

export interface BlockSyncerContext {
    sdk: SDK;
    db: DbClient;
}

export default class BlockSyncer {
    private context: BlockSyncerContext;
    constructor(context: BlockSyncerContext) {
        this.context = context;
    }
    public run = () => {
        // TODO
    };
}
