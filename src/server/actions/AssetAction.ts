import { Buffer } from "buffer";
import { TransactionDoc } from "codechain-indexer-types/lib/types";
import { Type } from "codechain-indexer-types/lib/utils";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Router } from "express";
import * as _ from "lodash";
import { ServerContext } from "../ServerContext";

function handle(context: ServerContext, router: Router) {
    router.get("/asset-txs/:assetType", async (req, res, next) => {
        const { assetType } = req.params;
        const { page, itemsPerPage } = req.query;
        try {
            const txs: TransactionDoc[] = await context.db.getTransactionsByAssetType(new H256(assetType), {
                page,
                itemsPerPage
            });
            res.send(txs);
        } catch (e) {
            next(e);
        }
    });

    router.get("/asset-txs/:assetType/totalCount", async (req, res, next) => {
        const { assetType } = req.params;
        try {
            const count = await context.db.getTotalTransactionCountByAssetType(new H256(assetType));
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });

    router.get("/search/asset/:assetName", async (req, res, next) => {
        const { assetName } = req.params;
        try {
            const assetBundles = await context.db.getAssetBundlesByAssetName(assetName);
            res.send(assetBundles);
        } catch (e) {
            next(e);
        }
    });

    router.get("/asset/:assetType", async (req, res, next) => {
        const { assetType } = req.params;
        try {
            if (!Type.isH256String(assetType)) {
                res.send(JSON.stringify(null));
                return;
            }
            const assetScheme = await context.db.getAssetScheme(new H256(assetType));
            assetScheme ? res.send(assetScheme) : res.send(JSON.stringify(null));
        } catch (e) {
            next(e);
        }
    });

    router.get("/asset/pending/:assetType", async (req, res, next) => {
        const { assetType } = req.params;
        try {
            if (!Type.isH256String(assetType)) {
                res.send(JSON.stringify(null));
                return;
            }
            const assetScheme = await context.db.getPendingAssetScheme(new H256(assetType));
            assetScheme ? res.send(assetScheme) : res.send(JSON.stringify(null));
        } catch (e) {
            next(e);
        }
    });

    router.get("/asset/image/:assetType", async (req, res, next) => {
        const { assetType } = req.params;
        try {
            if (!Type.isH256String(assetType)) {
                res.status(404).send("Not found");
                return;
            }
            const assetImage = await context.db.getAssetImageBlob(new H256(assetType));
            if (!assetImage) {
                res.status(404).send("Not found");
                return;
            }
            const img = Buffer.from(assetImage, "base64");
            res.writeHead(200, {
                "Content-Type": "image/png",
                "Content-Length": img.length
            });
            res.end(img);
        } catch (e) {
            next(e);
        }
    });

    router.get("/aggs-utxo/:address", async (req, res, next) => {
        const { address } = req.params;
        const { page, itemsPerPage, isConfirmed } = req.query;
        try {
            const bestBlockNumber = await context.db.getLastBlockNumber();
            const utxoList = await context.db.getAggsUTXOList(
                address,
                bestBlockNumber,
                // FIXME: Change the confirm threshold according to the consensus.
                5,
                isConfirmed === undefined || isConfirmed === "true",
                {
                    itemsPerPage,
                    page
                }
            );
            const result = await Promise.all(
                _.map(utxoList, async utxo => ({
                    ...utxo,
                    assetScheme: await context.db.getAssetScheme(new H256(utxo.assetType))
                }))
            );
            res.send(result);
        } catch (e) {
            next(e);
        }
    });

    router.get("/aggs-utxo/:address/:assetType", async (req, res, next) => {
        const { address, assetType } = req.params;

        const { isConfirmed } = req.query;
        try {
            if (!Type.isH256String(assetType)) {
                res.send(JSON.stringify(null));
                return;
            }
            const bestBlockNumber = await context.db.getLastBlockNumber();
            const utxo = await context.db.getAggsUTXOByAssetType(
                address,
                new H256(assetType),
                bestBlockNumber,
                // FIXME: Change the confirm threshold according to the consensus.
                5,
                isConfirmed === undefined || isConfirmed === "true"
            );
            if (utxo) {
                const assetScheme = await context.db.getAssetScheme(new H256(utxo.assetType));
                const response = { ...utxo, assetScheme };
                res.send(response);
            } else {
                res.send(JSON.stringify(null));
            }
        } catch (e) {
            next(e);
        }
    });

    router.get("/utxo/:address/:assetType", async (req, res, next) => {
        const { address, assetType } = req.params;
        const { page, itemsPerPage, lastBlockNumber, lastParcelIndex, lastTransactionIndex, isConfirmed } = req.query;
        try {
            let calculatedLastBlockNumber;
            let calculatedLastParcelIndex;
            let calculatedLastTransactionIndex;
            const bestBlockNumber = await context.db.getLastBlockNumber();
            if (lastBlockNumber && lastParcelIndex && lastTransactionIndex) {
                calculatedLastBlockNumber = lastBlockNumber;
                calculatedLastParcelIndex = lastParcelIndex;
                calculatedLastTransactionIndex = lastTransactionIndex;
            } else if (page === 1 || !page) {
                calculatedLastBlockNumber = Number.MAX_VALUE;
                calculatedLastParcelIndex = Number.MAX_VALUE;
                calculatedLastTransactionIndex = Number.MAX_VALUE;
            } else {
                const beforePageAssetCount = (page - 1) * itemsPerPage;
                let currentAssetCount = 0;
                let lastBlockNumberCursor = Number.MAX_VALUE;
                let lastParcelIndexCursor = Number.MAX_VALUE;
                let lastTransactionIndexCursor = Number.MAX_VALUE;
                while (beforePageAssetCount - currentAssetCount > 10000) {
                    const cursorAsset = await context.db.getUTXOListByAssetType(
                        address,
                        new H256(assetType),
                        bestBlockNumber,
                        // FIXME: Change the confirm threshold according to the consensus.
                        5,
                        isConfirmed === undefined || isConfirmed === "true",
                        {
                            lastBlockNumber: lastBlockNumberCursor,
                            lastParcelIndex: lastParcelIndexCursor,
                            lastTransactionIndex: lastTransactionIndexCursor,
                            itemsPerPage: 10000
                        }
                    );
                    const lastCursorAsset = _.last(cursorAsset);
                    if (lastCursorAsset) {
                        lastBlockNumberCursor = lastCursorAsset.blockNumber;
                        lastParcelIndexCursor = lastCursorAsset.parcelIndex;
                        lastTransactionIndexCursor = lastCursorAsset.transactionIndex;
                    }
                    currentAssetCount += 10000;
                }
                const skipCount = beforePageAssetCount - currentAssetCount;
                const skipAssets = await context.db.getUTXOListByAssetType(
                    address,
                    new H256(assetType),
                    bestBlockNumber,
                    // FIXME: Change the confirm threshold according to the consensus.
                    5,
                    isConfirmed === undefined || isConfirmed === "true",
                    {
                        lastBlockNumber: lastBlockNumberCursor,
                        lastParcelIndex: lastParcelIndexCursor,
                        lastTransactionIndex: lastTransactionIndexCursor,
                        itemsPerPage: skipCount
                    }
                );
                const lastSkipAsset = _.last(skipAssets);
                if (lastSkipAsset) {
                    lastBlockNumberCursor = lastSkipAsset.blockNumber;
                    lastParcelIndexCursor = lastSkipAsset.parcelIndex;
                    lastTransactionIndexCursor = lastSkipAsset.transactionIndex;
                }
                calculatedLastBlockNumber = lastBlockNumberCursor;
                calculatedLastParcelIndex = lastParcelIndexCursor;
                calculatedLastTransactionIndex = lastTransactionIndexCursor;
            }
            const assets = await context.db.getUTXOListByAssetType(
                address,
                new H256(assetType),
                bestBlockNumber,
                // FIXME: Change the confirm threshold according to the consensus.
                5,
                isConfirmed === undefined || isConfirmed === "true",
                {
                    lastBlockNumber: calculatedLastBlockNumber,
                    lastParcelIndex: calculatedLastParcelIndex,
                    lastTransactionIndex: calculatedLastTransactionIndex,
                    itemsPerPage
                }
            );

            const result = await Promise.all(
                _.map(assets, async asset => ({
                    ...asset,
                    assetScheme: await context.db.getAssetScheme(new H256(asset.asset.assetType))
                }))
            );
            res.send(result);
        } catch (e) {
            next(e);
        }
    });
}

export const AssetAction = {
    handle
};
