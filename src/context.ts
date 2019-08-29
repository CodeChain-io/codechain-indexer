import { SDK } from "codechain-sdk";
import { createSlack, Slack } from "./checker/slack";
import { IndexerConfig } from "./config";
import models from "./models";
import Worker from "./worker";

export class IndexerContext {
    public static newInstance(options: IndexerConfig) {
        return new IndexerContext(options);
    }
    public sdk: SDK;
    public worker: Worker;
    public slack: Slack;

    private constructor(public readonly options: IndexerConfig) {
        this.sdk = new SDK({
            server: options.codechain.host,
            networkId: options.codechain.networkId
        });
        this.slack = createSlack(
            `[${options.codechain.networkId}][indexer]`,
            process.env.SLACK_WEBHOOK
        );
        this.worker = new Worker(
            { sdk: this.sdk, slack: this.slack },
            options.worker
        );
    }

    public destroy = async () => {
        console.log("Destroying the context...");
        await models.sequelize.close();
    };
}
