import { AssetDoc } from "codechain-indexer-types/lib/types";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Client } from "elasticsearch";
import * as _ from "lodash";
import moment = require("moment");
import { ElasticSearchAgent } from "..";
import { BaseAction } from "./BaseAction";

export class QuerySnapshot implements BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;

    public async getSnapshotRequests() {
        const response = await this.client.search<{
            timestamp: number;
            assetType: string;
        }>({
            index: "snapshot_request",
            type: "_doc",
            body: {
                size: 10000,
                sort: [{ timestamp: { order: "asc" } }],
                query: {
                    term: {
                        status: "wait"
                    }
                }
            }
        });

        return _.map(response.hits.hits, hit => {
            return {
                snapshotId: hit._id,
                assetType: hit._source.assetType,
                date: moment.unix(hit._source.timestamp).toDate()
            };
        });
    }

    public async getSnapshotUTXOList(snapshotId: string) {
        const response = await this.client.search<{
            utxoList: {
                address: string;
                asset: AssetDoc;
            }[];
            blockNumber: number;
        }>({
            index: "utxo_snapshot",
            type: "_doc",
            body: {
                size: 1,
                query: {
                    term: {
                        _id: snapshotId
                    }
                }
            }
        });

        if (response.hits.total === 0) {
            return null;
        }

        return response.hits.hits[0]._source;
    }

    public async getSnapshotUTXOByBlockNumber(blockNumber: number) {
        const response = await this.client.search<{
            utxoList: {
                address: string;
                asset: AssetDoc;
            }[];
            blockNumber: number;
        }>({
            index: "utxo_snapshot",
            type: "_doc",
            body: {
                size: 1,
                query: {
                    term: {
                        blockNumber
                    }
                }
            }
        });

        if (response.hits.total === 0) {
            return null;
        }

        return {
            source: response.hits.hits[0]._source,
            id: response.hits.hits[0]._id
        };
    }

    public async indexSnapshotRequest(snapshotId: string, assetType: H256, timestamp: number) {
        return this.client.update({
            index: "snapshot_request",
            type: "_doc",
            id: snapshotId,
            body: {
                doc: {
                    timestamp,
                    assetType: assetType.value,
                    status: "wait"
                },
                doc_as_upsert: true
            },
            refresh: "true"
        });
    }

    public async updateSnapshotRequestStatus(snapshotId: string, status: "wait" | "done") {
        return this.client.update({
            index: "snapshot_request",
            type: "_doc",
            id: snapshotId,
            body: {
                doc: {
                    status
                }
            },
            refresh: "true"
        });
    }

    public async indexSnapshotUTXOList(
        snapshotId: string,
        utxoList: {
            address: string;
            asset: AssetDoc;
        }[],
        blockNumber: number
    ): Promise<void> {
        return this.client.update({
            index: "utxo_snapshot",
            type: "_doc",
            id: snapshotId,
            body: {
                doc: {
                    utxoList,
                    blockNumber
                },
                doc_as_upsert: true
            }
        });
    }
}
