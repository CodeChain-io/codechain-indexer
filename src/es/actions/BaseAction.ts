import { Client } from "elasticsearch";
import { ElasticSearchAgent } from "..";

export class BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;
}
