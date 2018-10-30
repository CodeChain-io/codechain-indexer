import {
    AssetDoc,
    AssetMintTransactionDoc,
    AssetSchemeDoc,
    AssetTransferTransactionDoc,
    BlockDoc,
    ParcelDoc,
    PendingParcelDoc,
    PendingTransactionDoc,
    TransactionDoc
} from "codechain-indexer-types/lib/types";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Client, CountResponse, DeleteDocumentResponse, SearchResponse } from "elasticsearch";
import { Account, QueryAccount } from "./actions/QueryAccount";
import { QueryAsset } from "./actions/QueryAsset";
import { QueryBlock } from "./actions/QueryBlock";
import { QueryImage } from "./actions/QueryImage";
import { QueryIndex } from "./actions/QueryIndex";
import { LogData, LogType, QueryLog } from "./actions/QueryLog";
import { QueryParcel } from "./actions/QueryParcel";
import { QueryPendingParcel } from "./actions/QueryPendingParcel";
import { QueryTransaction } from "./actions/QueryTransaction";

export class ElasticSearchAgent
    implements
        QueryBlock,
        QueryParcel,
        QueryTransaction,
        QueryPendingParcel,
        QueryIndex,
        QueryLog,
        QueryAccount,
        QueryImage,
        QueryAsset {
    public client: Client;
    public agent: ElasticSearchAgent;
    public getBlockByHash!: (hash: H256) => Promise<BlockDoc | null>;
    public getLastBlockNumber!: () => Promise<number>;
    public getBlock!: (blockNumber: number) => Promise<BlockDoc | null>;
    public getBlocks!: (
        params?: { lastBlockNumber?: number | null; itemsPerPage?: number | null } | null
    ) => Promise<BlockDoc[]>;
    public getTotalBlockCount!: () => Promise<number>;
    public getBlocksByPlatformAddress!: (
        address: string,
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
        } | null
    ) => Promise<BlockDoc[]>;
    public retractBlock!: (blockHash: H256) => Promise<void>;
    public indexBlock!: (blockDoc: BlockDoc) => Promise<any>;
    public updateBlock!: (hash: H256, partial: any) => Promise<any>;
    public searchBlock!: (body: any) => Promise<SearchResponse<any>>;
    public countBlock!: (body: any) => Promise<CountResponse>;
    public countParcel!: (body: any) => Promise<CountResponse>;
    public countTransaction!: (body: any) => Promise<CountResponse>;
    public getParcel!: (hash: H256) => Promise<ParcelDoc | null>;
    public getParcels!: (
        params?: {
            lastBlockNumber?: number | null;
            lastParcelIndex?: number | null;
            itemsPerPage?: number | null;
        } | null
    ) => Promise<ParcelDoc[]>;
    public getParcelsByPlatformAddress!: (
        address: string,
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
        } | null
    ) => Promise<ParcelDoc[]>;
    public searchParcel!: (body: any) => Promise<SearchResponse<any>>;
    public retractParcel!: (parcelHash: H256) => Promise<void>;
    public indexParcel!: (parcelDoc: ParcelDoc) => Promise<any>;
    public updateParcel!: (hash: H256, partial: any) => Promise<any>;
    public getTransaction!: (hash: H256) => Promise<AssetMintTransactionDoc | AssetTransferTransactionDoc | null>;
    public getTransactions!: (
        params?: {
            lastBlockNumber?: number | null;
            lastParcelIndex?: number | null;
            lastTransactionIndex?: number | null;
            itemsPerPage?: number | null;
        } | null
    ) => Promise<TransactionDoc[]>;
    public getTransactionsByAssetType!: (
        assetType: H256,
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
        } | null
    ) => Promise<TransactionDoc[]>;
    public getTransactionsByAssetTransferAddress!: (
        address: string,
        params?: {
            page?: number | null;
            itemsPerPage: number | null;
        } | null
    ) => Promise<TransactionDoc[]>;
    public getAssetScheme!: (assetType: H256) => Promise<AssetSchemeDoc | null>;
    public getAssetInfosByAssetName!: (name: string) => Promise<{ assetScheme: AssetSchemeDoc; assetType: string }[]>;
    public searchTransaction!: (body: any) => Promise<SearchResponse<any>>;
    public retractTransaction!: (transactionHash: H256) => Promise<void>;
    public indexTransaction!: (transactionDoc: TransactionDoc) => Promise<any>;
    public updateTransaction!: (hash: H256, partial: any) => Promise<any>;
    public getAllOfCurrentPendingParcels!: () => Promise<PendingParcelDoc[]>;
    public getCurrentPendingParcels!: (
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
            actionFilters?: string[] | null;
            signerFilter?: string | null;
            sorting?: string | null;
            orderBy?: string | null;
        } | null
    ) => Promise<PendingParcelDoc[]>;
    public getPendingParcel!: (hash: H256) => Promise<PendingParcelDoc | null>;
    public getPendingTransaction!: (hash: H256) => Promise<PendingTransactionDoc | null>;
    public getDeadPendingParcels!: () => Promise<PendingParcelDoc[]>;
    public searchPendinParcel!: (body: any) => Promise<SearchResponse<any>>;
    public deadPendingParcel!: (hash: H256) => Promise<void>;
    public removePendingParcel!: (hash: H256) => Promise<DeleteDocumentResponse>;
    public indexPendingParcel!: (pendingParcelDoc: PendingParcelDoc) => Promise<any>;
    public revialPendingParcel!: (hash: H256) => Promise<void>;
    public checkIndexOrCreate!: () => Promise<void>;
    public getTotalParcelCount!: () => Promise<number>;
    public getTotalTransactionCount!: () => Promise<number>;
    public countPendingParcel!: (body: any) => Promise<CountResponse>;
    public getTotalPendingParcelCount!: (
        params?: { signerFilter?: string | null; actionFilters?: string[] | null } | null
    ) => Promise<number>;
    public getTotalParcelCountByPlatformAddress!: (address: string) => Promise<number>;
    public getTotalTransactionCountByAssetType!: (assetType: H256) => Promise<number>;
    public getTotalTxCountByAssetTransferAddress!: (address: string) => Promise<number>;
    public getTotalBlockCountByPlatformAddress!: (address: string) => Promise<number>;
    public increaseLogCount!: (
        date: string,
        logType: LogType,
        count: number,
        value?: string | undefined
    ) => Promise<void>;
    public decreaseLogCount!: (
        date: string,
        logType: LogType,
        count: number,
        value?: string | undefined
    ) => Promise<void>;
    public getLogCount!: (date: string, logType: LogType) => Promise<number>;
    public getBestMiners!: (date: string) => Promise<LogData[]>;
    public searchLog!: (body: any) => Promise<SearchResponse<any>>;
    public indexLog!: (date: string, logType: LogType, count: number, value?: string | undefined) => Promise<any>;
    public updateLog!: (logData: LogData, doc: any) => Promise<void>;
    public getLog!: (date: string, logType: LogType, value?: string | undefined) => Promise<LogData | null>;
    public updateAccount!: (address: string, balance: string) => Promise<void>;
    public getAccount!: (address: string) => Promise<Account | null>;
    public getAccounts!: () => Promise<Account[]>;
    public getPendingAssetScheme!: (assetType: H256) => Promise<AssetSchemeDoc | null>;
    public getAssetImageBlob!: (assetType: H256) => Promise<string | null>;
    public indexImage!: (assetType: H256, imageBlob: string) => Promise<any>;
    public searchImage!: (body: any) => Promise<SearchResponse<any>>;
    public removeImage!: (assetType: H256) => Promise<DeleteDocumentResponse>;
    public getUTXOListByAssetType!: (
        address: string,
        assetType: H256,
        currentBestBlockNumber: number,
        confirmThreshold: number,
        isConfirmed: boolean,
        params?: {
            lastBlockNumber?: number | null;
            lastParcelIndex?: number | null;
            lastTransactionIndex?: number | null;
            itemsPerPage?: number | null;
        } | null
    ) => Promise<
        {
            asset: AssetDoc;
            blockNumber: number;
            parcelIndex: number;
            transactionIndex: number;
        }[]
    >;
    public getAggsUTXOByAssetType!: (
        address: string,
        assetType: H256,
        currentBestBlockNumber: number,
        confirmThreshold: number,
        isConfirmed?: boolean
    ) => Promise<
        | {
              assetType: string;
              totalAssetQuantity: number;
              utxoQuantity: number;
          }
        | undefined
    >;
    public getAggsUTXOList!: (
        address: string,
        currentBestBlockNumber: number,
        confirmThreshold: number,
        isConfirmed: boolean
    ) => Promise<
        {
            assetType: string;
            totalAssetQuantity: number;
            utxoQuantity: number;
        }[]
    >;
    public indexAsset!: (
        address: string,
        assetDoc: AssetDoc,
        blockNumber: number,
        parcelIndex: number,
        transactionIndex: number
    ) => Promise<void>;
    public revivalAsset!: (
        address: string,
        assetType: H256,
        transactionHash: H256,
        transactionOutputIndex: number
    ) => Promise<DeleteDocumentResponse>;
    public removeAsset!: (
        address: string,
        assetType: H256,
        transactionHash: H256,
        transactionOutputIndex: number
    ) => Promise<DeleteDocumentResponse>;
    public getPendingTransactionsByAddress!: (
        address: string,
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
        } | null
    ) => Promise<PendingTransactionDoc[]>;
    public getPendingPaymentParcelsByAddress!: (
        address: string,
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
        } | null
    ) => Promise<PendingParcelDoc[]>;
    constructor(host: string) {
        this.client = new Client({
            host
        });
        this.agent = this;
    }

    public ping = async (): Promise<string> => {
        return this.client.ping({ requestTimeout: 30000 }).then(() => {
            return "pong";
        });
    };
}

applyMixins(ElasticSearchAgent, [
    QueryBlock,
    QueryParcel,
    QueryTransaction,
    QueryPendingParcel,
    QueryIndex,
    QueryLog,
    QueryAccount,
    QueryImage,
    QueryAsset
]);
function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}
