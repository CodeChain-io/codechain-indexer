import { AssetDoc } from "codechain-es/lib/types";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Client, DeleteDocumentResponse } from "elasticsearch";
import * as _ from "lodash";
import { ElasticSearchAgent } from "..";
import { BaseAction } from "./BaseAction";

export interface AssetResponse {
    asset: AssetDoc;
    blockNumber: number;
    parcelIndex: number;
    transactionIndex: number;
}

export interface UTXO {
    assetType: string;
    totalAssetQuantity: number;
    utxoQuantity: number;
}

export class QueryAsset implements BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;

    public async getUTXOByAssetType(
        address: string,
        assetType: H256,
        lastBlockNumber: number = Number.MAX_VALUE,
        lastParcelIndex: number = Number.MAX_VALUE,
        lastTransactionIndex: number = Number.MAX_VALUE,
        itemsPerPage: number = 25
    ): Promise<AssetResponse[]> {
        const response = await this.client.search<AssetResponse>({
            index: "asset",
            type: "_doc",
            body: {
                sort: [
                    { blockNumber: { order: "desc" } },
                    { parcelIndex: { order: "desc" } },
                    { transactionIndex: { order: "desc" } }
                ],
                size: itemsPerPage,
                search_after: [lastBlockNumber, lastParcelIndex, lastTransactionIndex],
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    address: {
                                        value: address
                                    }
                                }
                            },
                            {
                                term: {
                                    "asset.assetType": {
                                        value: assetType
                                    }
                                }
                            },
                            {
                                term: {
                                    isRemoved: {
                                        value: false
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        });
        return _.map(response.hits.hits, hit => {
            return {
                asset: hit._source.asset,
                blockNumber: hit._source.blockNumber,
                parcelIndex: hit._source.parcelIndex,
                transactionIndex: hit._source.transactionIndex
            };
        });
    }

    public async getUTXOList(address: string, page: number = 0, itemsPerPage: number = 25): Promise<UTXO[]> {
        const response = await this.client.search<AssetResponse>({
            index: "asset",
            type: "_doc",
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    address: {
                                        value: address
                                    }
                                }
                            },
                            {
                                term: {
                                    isRemoved: {
                                        value: false
                                    }
                                }
                            }
                        ]
                    }
                },
                size: 0,
                aggs: {
                    asset_bucket: {
                        composite: {
                            sources: [
                                {
                                    type: {
                                        terms: {
                                            field: "asset.assetType"
                                        }
                                    }
                                }
                            ]
                        },
                        aggs: {
                            sum_of_asset: {
                                sum: {
                                    field: "asset.amount"
                                }
                            },
                            asset_bucket_sort: {
                                bucket_sort: {
                                    sort: [
                                        {
                                            sum_of_asset: {
                                                order: "desc"
                                            }
                                        }
                                    ],
                                    from: page * itemsPerPage,
                                    size: itemsPerPage
                                }
                            }
                        }
                    }
                }
            }
        });
        return _.map(response.aggregations.asset_bucket.buckets, bucket => {
            return {
                assetType: bucket.key.type,
                totalAssetQuantity: bucket.sum_of_asset.value,
                utxoQuantity: bucket.doc_count
            };
        });
    }

    public async indexAsset(
        address: string,
        assetDoc: AssetDoc,
        blockNumber: number,
        parcelIndex: number,
        transactionIndex: number
    ): Promise<void> {
        return this.client.update({
            index: "asset",
            type: "_doc",
            id: `${address}-${assetDoc.assetType}-${assetDoc.transactionHash}-${assetDoc.transactionOutputIndex}`,
            body: {
                doc: {
                    address,
                    asset: assetDoc,
                    blockNumber,
                    parcelIndex,
                    transactionIndex,
                    isRemoved: false
                },
                doc_as_upsert: true
            },
            refresh: "true"
        });
    }

    public async removeAsset(
        address: string,
        assetType: H256,
        transactionHash: H256,
        transactionOutputIndex: number
    ): Promise<DeleteDocumentResponse> {
        return this.client.update({
            index: "asset",
            type: "_doc",
            id: `${address}-${assetType.value}-${transactionHash.value}-${transactionOutputIndex}`,
            body: {
                doc: {
                    isRemoved: true
                }
            },
            refresh: "true"
        });
    }

    public async revivalAsset(
        address: string,
        assetType: H256,
        transactionHash: H256,
        transactionOutputIndex: number
    ): Promise<DeleteDocumentResponse> {
        return this.client.update({
            index: "asset",
            type: "_doc",
            id: `${address}-${assetType.value}-${transactionHash.value}-${transactionOutputIndex}`,
            body: {
                doc: {
                    isRemoved: false
                }
            },
            refresh: "true"
        });
    }
}
