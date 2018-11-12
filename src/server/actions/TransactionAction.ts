import { Type } from "codechain-indexer-types/lib/utils";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Router } from "express";
import * as _ from "lodash";
import { ServerContext } from "../ServerContext";

function handle(context: ServerContext, router: Router) {
    router.get("/tx/:hash", async (req, res, next) => {
        const { hash } = req.params;
        try {
            if (!Type.isH256String(hash)) {
                res.send(JSON.stringify(null));
                return;
            }
            const transaction = await context.db.getTransaction(new H256(hash));
            transaction ? res.send(transaction) : res.send(JSON.stringify(null));
        } catch (e) {
            next(e);
        }
    });

    router.get("/txs", async (req, res, next) => {
        const page = req.query.page && parseInt(req.query.page, 10);
        const itemsPerPage = req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
        const lastBlockNumber = req.query.lastBlockNumber && parseInt(req.query.lastBlockNumber, 10);
        const lastParcelIndex = req.query.lastParcelIndex && parseInt(req.query.lastParcelIndex, 10);
        const address: string | null | undefined = req.query.address;
        const assetType: string | null | undefined = req.query.assetType;
        const onlyUnconfirmed = req.query.onlyUnconfirmed;
        const confirmThreshold = req.query.confirmThreshold != undefined ? parseInt(req.query.confirmThreshold, 10) : 5;
        try {
            let currentBestBlockNumber = 0;
            if (onlyUnconfirmed === "true") {
                currentBestBlockNumber = await context.db.getLastBlockNumber();
            }
            let calculatedLastBlockNumber;
            let calculatedLastParcelIndex;
            if (lastBlockNumber && lastParcelIndex) {
                calculatedLastBlockNumber = lastBlockNumber;
                calculatedLastParcelIndex = lastParcelIndex;
            } else if (page === 1 || !page) {
                calculatedLastBlockNumber = Number.MAX_VALUE;
                calculatedLastParcelIndex = Number.MAX_VALUE;
            } else {
                const beforePageTxCount = (page - 1) * itemsPerPage;
                let currentTxCount = 0;
                let lastBlockNumberCursor = Number.MAX_VALUE;
                let lastParcelIndexCursor = Number.MAX_VALUE;
                while (beforePageTxCount - currentTxCount > 10000) {
                    const cursorTx = await context.db.getTransactions({
                        lastBlockNumber: lastBlockNumberCursor,
                        lastParcelIndex: lastParcelIndexCursor,
                        itemsPerPage: 10000,
                        assetType: assetType ? new H256(assetType) : null,
                        address,
                        onlyUnconfirmed: onlyUnconfirmed === "true",
                        currentBestBlockNumber,
                        confirmThreshold
                    });
                    const lastCursorTx = _.last(cursorTx);
                    if (lastCursorTx) {
                        lastBlockNumberCursor = lastCursorTx.data.blockNumber as number;
                        lastParcelIndexCursor = lastCursorTx.data.parcelIndex as number;
                    }
                    currentTxCount += 10000;
                }
                const skipCount = beforePageTxCount - currentTxCount;
                const skipTxs = await context.db.getTransactions({
                    lastBlockNumber: lastBlockNumberCursor,
                    lastParcelIndex: lastParcelIndexCursor,
                    itemsPerPage: skipCount,
                    assetType: assetType ? new H256(assetType) : null,
                    address,
                    onlyUnconfirmed: onlyUnconfirmed === "true",
                    currentBestBlockNumber,
                    confirmThreshold
                });
                const lastSkipTxs = _.last(skipTxs);
                if (lastSkipTxs) {
                    lastBlockNumberCursor = lastSkipTxs.data.blockNumber as number;
                    lastParcelIndexCursor = lastSkipTxs.data.parcelIndex as number;
                }
                calculatedLastBlockNumber = lastBlockNumberCursor;
                calculatedLastParcelIndex = lastParcelIndexCursor;
            }
            const transactions = await context.db.getTransactions({
                lastBlockNumber: calculatedLastBlockNumber,
                lastParcelIndex: calculatedLastParcelIndex,
                itemsPerPage,
                assetType: assetType ? new H256(assetType) : null,
                address,
                onlyUnconfirmed: onlyUnconfirmed === "true",
                currentBestBlockNumber,
                confirmThreshold
            });
            res.send(transactions);
        } catch (e) {
            next(e);
        }
    });

    router.get("/txs/pending/:address", async (req, res, next) => {
        const { address } = req.params;
        try {
            const pendingTxs = await context.db.getPendingTransactionsByAddress(address);
            res.send(pendingTxs);
        } catch (e) {
            next(e);
        }
    });

    router.get("/txs/totalCount", async (req, res, next) => {
        const address: string | null | undefined = req.query.address;
        const assetType: string | null | undefined = req.query.assetType;
        try {
            const countOfBlocks = await context.db.getTotalTransactionCount({
                assetType: assetType ? new H256(assetType) : null,
                address
            });
            res.send(JSON.stringify(countOfBlocks));
        } catch (e) {
            next(e);
        }
    });

    router.get("/tx/pending/:hash", async (req, res, next) => {
        const { hash } = req.params;
        try {
            if (!Type.isH256String(hash)) {
                res.send(JSON.stringify(null));
                return;
            }
            const pendingTransaction = await context.db.getPendingTransaction(new H256(hash));
            pendingTransaction ? res.send(pendingTransaction) : res.send(JSON.stringify(null));
        } catch (e) {
            next(e);
        }
    });
}

export const TransactionAction = {
    handle
};
