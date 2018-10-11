import { Client } from "elasticsearch";
import * as _ from "lodash";
import { ElasticSearchAgent } from "..";
import { BaseAction } from "./BaseAction";

export interface Account {
    address: string;
    balance: string;
}

interface AccountData {
    balance: string;
}

export class QueryAccount implements BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;

    public async getAccounts(): Promise<Account[]> {
        const response = await this.client.search<AccountData>({
            index: "account",
            type: "_doc",
            body: {
                size: 10000,
                query: {
                    match_all: {}
                }
            }
        });
        return _.map(response.hits.hits, hit => {
            return {
                address: hit._id,
                balance: hit._source.balance
            };
        });
    }

    public async updateAccount(address: string, balance: string): Promise<void> {
        return this.client.update({
            index: "account",
            type: "_doc",
            id: address,
            body: {
                doc: {
                    balance
                },
                doc_as_upsert: true
            }
        });
    }

    public async getAccount(address: string): Promise<Account | null> {
        const response = await this.client.search<AccountData>({
            index: "account",
            type: "_doc",
            body: {
                size: 1,
                query: {
                    term: {
                        _id: address
                    }
                }
            }
        });
        if (response.hits.total === 0) {
            return null;
        }
        return {
            balance: response.hits.hits[0]._source.balance,
            address
        };
    }
}
