import { AssetDoc } from "codechain-indexer-types/lib/types";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Client } from "elasticsearch";
import * as _ from "lodash";
import { ElasticSearchAgent } from "..";
import { BaseAction } from "./BaseAction";

export class QuerySnapshot implements BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;

    public async getSnapshotRequests() {
        const response = await this.client.search<{
            blockNumber: number;
            assetType: string;
        }>({
            index: "snapshot_request",
            type: "_doc",
            body: {
                size: 10000,
                sort: [{ blockNumber: { order: "desc" } }]
            }
        });

        return _.map(response.hits.hits, hit => hit._source);
    }

    public async getSnapshotUTXOList(assetType: H256, blockNumber: number) {
        const response = await this.client.search<{
            utxoList: {
                address: string;
                asset: AssetDoc;
            }[];
        }>({
            index: "utxo_snapshot",
            type: "_doc",
            body: {
                size: 1,
                query: {
                    term: {
                        _id: `${assetType.value}-${blockNumber}`
                    }
                }
            }
        });

        if (response.hits.total === 0) {
            return [];
        }

        return response.hits.hits[0]._source.utxoList;
    }

    public async hasSnapshotRequest(assetType: H256, blockNumber: number) {
        const response = await this.client.search<{
            blockNumber: number;
            assetType: string;
        }>({
            index: "snapshot_request",
            type: "_doc",
            body: {
                size: 1,
                query: {
                    term: {
                        _id: `${assetType.value}-${blockNumber}`
                    }
                }
            }
        });
        if (response.hits.total === 0) {
            return false;
        } else {
            return true;
        }
    }

    public async indexSnapshotRequest(assetType: H256, blockNumber: number) {
        return this.client.update({
            index: "snapshot_request",
            type: "_doc",
            id: `${assetType.value}-${blockNumber}`,
            body: {
                doc: {
                    blockNumber,
                    assetType: assetType.value
                },
                doc_as_upsert: true
            }
        });
    }

    public async indexSnapshotUTXOList(
        utxoList: {
            address: string;
            asset: AssetDoc;
        }[],
        assetType: H256,
        blockNumber: number
    ): Promise<void> {
        return this.client.update({
            index: "utxo_snapshot",
            type: "_doc",
            id: `${assetType.value}-${blockNumber}`,
            body: {
                doc: {
                    utxoList
                },
                doc_as_upsert: true
            }
        });
    }
}
