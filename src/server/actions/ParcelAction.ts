import { Type } from "codechain-indexer-types/lib/utils";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Router } from "express";
import * as _ from "lodash";
import { ServerContext } from "../ServerContext";

function handle(context: ServerContext, router: Router) {
    router.get("/parcels/totalCount", async (_R, res, next) => {
        try {
            const countOfBlocks = await context.db.getTotalParcelCount();
            res.send(JSON.stringify(countOfBlocks));
        } catch (e) {
            next(e);
        }
    });

    router.get("/parcels/pending", async (req, res, next) => {
        const { actionFilters, signerFilter, sorting, orderBy } = req.query;
        const page = req.query.page && parseInt(req.query.page, 10);
        const itemsPerPage = req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
        const parsedActionFilters = actionFilters && actionFilters.split(",");
        try {
            const pendingParcels = await context.db.getCurrentPendingParcels({
                page,
                itemsPerPage,
                actionFilters: parsedActionFilters,
                signerFilter,
                sorting,
                orderBy
            });
            res.send(pendingParcels);
        } catch (e) {
            next(e);
        }
    });

    router.get("/parcels/pending/totalCount", async (req, res, next) => {
        const { actionFilters, signerFilter } = req.query;
        const parsedActionFilters = actionFilters && actionFilters.split(",");
        try {
            const count = await context.db.getTotalPendingParcelCount({
                actionFilters: parsedActionFilters,
                signerFilter
            });
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });

    router.get("/parcel/pending/:hash", async (req, res, next) => {
        try {
            const { hash } = req.params;
            if (!Type.isH256String(hash)) {
                res.send(JSON.stringify(null));
                return;
            }
            const pendingParcel = await context.db.getPendingParcel(new H256(hash));
            pendingParcel ? res.send(pendingParcel) : res.send(JSON.stringify(null));
        } catch (e) {
            next(e);
        }
    });

    router.get("/parcels/pending/:address", async (req, res, next) => {
        const { address } = req.params;
        try {
            const pendingParcels = await context.db.getPendingParcelsByAddress(address);
            res.send(pendingParcels);
        } catch (e) {
            next(e);
        }
    });

    router.get("/parcel/:hash", async (req, res, next) => {
        const { hash } = req.params;
        try {
            const parcel = await context.db.getParcel(new H256(hash));
            parcel ? res.send(parcel) : res.send(JSON.stringify(null));
        } catch (e) {
            next(e);
        }
    });

    router.get("/parcels", async (req, res, next) => {
        const page = req.query.page && parseInt(req.query.page, 10);
        const itemsPerPage = req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
        const lastBlockNumber = req.query.lastBlockNumber && parseInt(req.query.lastBlockNumber, 10);
        const lastParcelIndex = req.query.lastParcelIndex && parseInt(req.query.lastParcelIndex, 10);
        const address: string | null | undefined = req.query.address;
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
                const beforePageParcelCount = (page - 1) * itemsPerPage;
                let currentParcel = 0;
                let lastBlockNumberCursor = Number.MAX_VALUE;
                let lastParcelIndexCursor = Number.MAX_VALUE;
                while (beforePageParcelCount - currentParcel > 10000) {
                    const cursorParcel = await context.db.getParcels({
                        lastBlockNumber: lastBlockNumberCursor,
                        lastParcelIndex: lastParcelIndexCursor,
                        itemsPerPage: 10000,
                        address,
                        onlyUnconfirmed: onlyUnconfirmed === "true",
                        currentBestBlockNumber,
                        confirmThreshold
                    });
                    const lastCursorParcel = _.last(cursorParcel);
                    if (lastCursorParcel) {
                        lastBlockNumberCursor = lastCursorParcel.blockNumber as number;
                        lastParcelIndexCursor = lastCursorParcel.parcelIndex as number;
                    }
                    currentParcel += 10000;
                }
                const skipCount = beforePageParcelCount - currentParcel;
                const skipParcels = await context.db.getParcels({
                    lastBlockNumber: lastBlockNumberCursor,
                    lastParcelIndex: lastParcelIndexCursor,
                    itemsPerPage: skipCount,
                    address,
                    onlyUnconfirmed: onlyUnconfirmed === "true",
                    currentBestBlockNumber,
                    confirmThreshold
                });
                const lastSkipParcels = _.last(skipParcels);
                if (lastSkipParcels) {
                    lastBlockNumberCursor = lastSkipParcels.blockNumber as number;
                    lastParcelIndexCursor = lastSkipParcels.parcelIndex as number;
                }
                calculatedLastBlockNumber = lastBlockNumberCursor;
                calculatedLastParcelIndex = lastParcelIndexCursor;
            }
            const parcels = await context.db.getParcels({
                lastBlockNumber: calculatedLastBlockNumber,
                lastParcelIndex: calculatedLastParcelIndex,
                itemsPerPage,
                address,
                onlyUnconfirmed: onlyUnconfirmed === "true",
                currentBestBlockNumber,
                confirmThreshold
            });
            res.send(parcels);
        } catch (e) {
            next(e);
        }
    });
}

export const ParcelAction = {
    handle
};
