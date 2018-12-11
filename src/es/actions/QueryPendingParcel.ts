import {
    AssetMintTransactionDoc,
    AssetSchemeDoc,
    AssetTransactionGroupDoc,
    AssetTransferTransactionDoc,
    PendingParcelDoc,
    PendingTransactionDoc,
    TransactionDoc
} from "codechain-indexer-types/lib/types";
import { Type } from "codechain-indexer-types/lib/utils";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Client, CountResponse, DeleteDocumentResponse, SearchResponse } from "elasticsearch";
import * as _ from "lodash";
import { ElasticSearchAgent } from "..";
import { BaseAction } from "./BaseAction";

export class QueryPendingParcel implements BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;

    public async getAllOfCurrentPendingParcels(): Promise<PendingParcelDoc[]> {
        const response = await this.searchPendinParcel({
            size: 10000,
            query: {
                bool: {
                    must: [{ term: { status: "pending" } }]
                }
            }
        });
        if (response.hits.total === 0) {
            return [];
        }
        return _.map(response.hits.hits, hit => hit._source);
    }

    public async getPendingTransactionsByAddress(
        address: string,
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
        } | null
    ): Promise<PendingTransactionDoc[]> {
        const query = [
            { term: { status: "pending" } },
            { term: { "parcel.action.action": "assetTransactionGroup" } },
            {
                bool: {
                    should: [
                        { term: { "parcel.action.transactions.data.inputs.prevOut.owner": address } },
                        { term: { "parcel.action.transactions.data.burns.prevOut.owner": address } },
                        { term: { "parcel.action.transactions.data.outputs.owner": address } },
                        { term: { "parcel.action.transactions.data.output.owner": address } }
                    ]
                }
            }
        ];

        const page = params && params.page != undefined ? params.page : 1;
        const response = await this.searchPendinParcel({
            sort: [{ timestamp: { order: "desc" } }],
            from: (page - 1) * (params && params.itemsPerPage != undefined ? params.itemsPerPage : 25),
            size: params && params.itemsPerPage != undefined ? params.itemsPerPage : 25,
            query: {
                bool: {
                    must: query
                }
            }
        });
        if (response.hits.total === 0) {
            return [];
        }
        const pendingTransactionGroupDocList = _.chain(response.hits.hits)
            .map(hit => hit._source as PendingParcelDoc)
            .filter(PendingParcel => Type.isAssetTransactionGroupDoc(PendingParcel.parcel.action))
            .value();

        let addressTxs: any = [];
        for (const pendingTransactionGroupDoc of pendingTransactionGroupDocList) {
            const assetTxGroup = pendingTransactionGroupDoc.parcel.action as AssetTransactionGroupDoc;
            const txs = _.chain(assetTxGroup.transactions)
                .filter((transaction: TransactionDoc) => {
                    if (Type.isAssetMintTransactionDoc(transaction)) {
                        const mintTx = transaction as AssetMintTransactionDoc;
                        if (mintTx.data.output.owner === address) {
                            return true;
                        } else {
                            return false;
                        }
                    } else if (Type.isAssetTransferTransactionDoc(transaction)) {
                        const transferTx = transaction as AssetTransferTransactionDoc;
                        if (_.find(transferTx.data.inputs, input => input.prevOut.owner === address)) {
                            return true;
                        } else if (_.find(transferTx.data.outputs, output => output.owner === address)) {
                            return true;
                        } else if (_.find(transferTx.data.burns, burn => burn.prevOut.owner === address)) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                    return false;
                })
                .map(tx => ({
                    timestamp: pendingTransactionGroupDoc.timestamp,
                    status: pendingTransactionGroupDoc.status,
                    transaction: tx
                }))
                .value();
            addressTxs = _.concat(addressTxs, txs);
        }
        return addressTxs;
    }

    public async getPendingParcelsByAddress(
        address: string,
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
        } | null
    ): Promise<PendingParcelDoc[]> {
        const query = [
            { term: { status: "pending" } },
            {
                bool: {
                    should: [{ term: { "parcel.signer": address } }, { term: { "parcel.action.receiver": address } }]
                }
            }
        ];
        const response = await this.searchPendinParcel({
            sort: [{ timestamp: { order: "desc" } }],
            from:
                ((params && params.page != undefined ? params.page : 1) - 1) *
                (params && params.itemsPerPage != undefined ? params.itemsPerPage : 25),
            size: params && params.itemsPerPage != undefined ? params.itemsPerPage : 25,
            query: {
                bool: {
                    must: query
                }
            }
        });
        if (response.hits.total === 0) {
            return [];
        }
        return _.map(response.hits.hits, hit => hit._source);
    }

    public async getCurrentPendingParcels(
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
            actionFilters?: string[] | null;
            signerFilter?: string | null;
            sorting?: string | null;
            orderBy?: string | null;
        } | null
    ): Promise<PendingParcelDoc[]> {
        let sortQuery;
        const orderBy = (params && params.orderBy) || "desc";
        switch ((params && params.sorting) || "pendingPeriod") {
            case "pendingPeriod":
                sortQuery = [{ timestamp: { order: orderBy } }];
                break;
            case "txs":
                sortQuery = [{ "parcel.countOfTransaction": { order: orderBy } }, { timestamp: { order: "desc" } }];
                break;
            case "fee":
                sortQuery = [{ "parcel.fee": { order: orderBy } }, { timestamp: { order: "desc" } }];
                break;
        }
        const query: any = [{ term: { status: "pending" } }];
        if (params && params.signerFilter) {
            query.push({ term: { "parcel.signer": params.signerFilter } });
        }
        if (params && params.actionFilters) {
            query.push({ terms: { "parcel.action.action": params.actionFilters } });
        }
        const response = await this.searchPendinParcel({
            sort: sortQuery,
            from:
                ((params && params.page != undefined ? params.page : 1) - 1) *
                (params && params.itemsPerPage != undefined ? params.itemsPerPage : 25),
            size: params && params.itemsPerPage != undefined ? params.itemsPerPage : 25,
            query: {
                bool: {
                    must: query
                }
            }
        });
        if (response.hits.total === 0) {
            return [];
        }
        return _.map(response.hits.hits, hit => hit._source);
    }

    public async getTotalPendingParcelCount(
        params?: { signerFilter?: string | null; actionFilters?: string[] | null } | null
    ): Promise<number> {
        const query: any = [{ term: { status: "pending" } }];
        if (params && params.signerFilter) {
            query.push({ term: { "parcel.signer": params.signerFilter } });
        }
        if (params && params.actionFilters) {
            query.push({ terms: { "parcel.action.action": params.actionFilters } });
        }
        const count = await this.countPendingParcel({
            query: {
                bool: {
                    must: query
                }
            }
        });
        return count.count;
    }

    public async getPendingParcel(hash: H256): Promise<PendingParcelDoc | null> {
        const response = await this.searchPendinParcel({
            size: 1,
            query: {
                bool: {
                    must: [
                        {
                            term: { "parcel.hash": hash.value }
                        }
                    ]
                }
            }
        });
        if (response.hits.total === 0) {
            return null;
        }
        return response.hits.hits[0]._source;
    }

    public async getPendingTransaction(hash: H256): Promise<PendingTransactionDoc | null> {
        const response = await this.searchPendinParcel({
            size: 1,
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                "parcel.action.transactions.data.hash": hash.value
                            }
                        }
                    ]
                }
            }
        });
        if (response.hits.total === 0) {
            return null;
        }
        const transactionDoc = _.chain(response.hits.hits)
            .flatMap(hit => hit._source as PendingParcelDoc)
            .map(PendingParcel => PendingParcel.parcel)
            .filter(parcel => Type.isAssetTransactionGroupDoc(parcel.action))
            .flatMap(parcel => (parcel.action as AssetTransactionGroupDoc).transactions)
            .filter((transaction: TransactionDoc) => transaction.data.hash === hash.value)
            .value();
        return {
            timestamp: response.hits.hits[0]._source.timestamp,
            status: response.hits.hits[0]._source.status,
            transaction: transactionDoc[0]
        };
    }

    public async getPendingAssetScheme(assetType: H256): Promise<AssetSchemeDoc | null> {
        const response = await this.searchPendinParcel({
            size: 1,
            query: {
                bool: {
                    must: [
                        { term: { status: "pending" } },
                        {
                            term: {
                                "parcel.action.transactions.data.output.assetType": assetType.value
                            }
                        }
                    ]
                }
            }
        });
        if (response.hits.total === 0) {
            return null;
        }
        const transactionDoc = _.chain(response.hits.hits)
            .flatMap(hit => hit._source as PendingParcelDoc)
            .map(PendingParcel => PendingParcel.parcel)
            .filter(parcel => Type.isAssetTransactionGroupDoc(parcel.action))
            .flatMap(parcel => (parcel.action as AssetTransactionGroupDoc).transactions)
            .filter(transaction => Type.isAssetMintTransactionDoc(transaction))
            .filter((transaction: AssetMintTransactionDoc) => transaction.data.output.assetType === assetType.value)
            .value();
        return Type.getAssetSchemeDoc(transactionDoc[0] as AssetMintTransactionDoc);
    }

    public async getDeadPendingParcels(): Promise<PendingParcelDoc[]> {
        const response = await this.searchPendinParcel({
            query: {
                bool: {
                    must: [{ term: { status: "dead" } }]
                }
            }
        });
        if (response.hits.total === 0) {
            return [];
        }
        return _.map(response.hits.hits, hit => hit._source);
    }

    public async searchPendinParcel(body: any): Promise<SearchResponse<any>> {
        return this.client.search({
            index: "pending_parcel",
            type: "_doc",
            body
        });
    }

    public async deadPendingParcel(hash: H256): Promise<void> {
        return this.client.update({
            index: "pending_parcel",
            type: "_doc",
            id: hash.value,
            body: {
                doc: {
                    status: "dead"
                }
            }
        });
    }

    public async removePendingParcel(hash: H256): Promise<DeleteDocumentResponse> {
        return this.client.delete({
            index: "pending_parcel",
            type: "_doc",
            id: hash.value
        });
    }

    public async indexPendingParcel(pendingParcelDoc: PendingParcelDoc): Promise<any> {
        return this.client.index({
            index: "pending_parcel",
            type: "_doc",
            id: pendingParcelDoc.parcel.hash,
            body: pendingParcelDoc
        });
    }

    public async revialPendingParcel(hash: H256): Promise<void> {
        return this.client.update({
            index: "pending_parcel",
            type: "_doc",
            id: hash.value,
            body: {
                doc: {
                    status: "pending"
                }
            }
        });
    }

    public async countPendingParcel(body: any): Promise<CountResponse> {
        return this.client.count({
            index: "pending_parcel",
            type: "_doc",
            body
        });
    }
}
