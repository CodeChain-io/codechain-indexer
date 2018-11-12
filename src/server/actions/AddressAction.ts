import { TransactionDoc } from "codechain-indexer-types/lib/types";
import { AssetTransferAddress, PlatformAddress } from "codechain-sdk/lib/core/classes";
import { Router } from "express";
import * as _ from "lodash";
import { ServerContext } from "../ServerContext";

function handle(context: ServerContext, router: Router) {
    router.get("/addr-platform-account/:address", async (req, res, next) => {
        const { address } = req.params;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify(null));
            return;
        }
        try {
            const balance = await context.db.getAccount(address);
            const seq = await context.codechainSdk.rpc.chain.getSeq(address);
            const account = {
                balance: balance ? balance.balance : 0,
                seq: seq ? seq.value.toString(10) : 0
            };
            res.send(account);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-blocks/:address", async (req, res, next) => {
        const { address } = req.params;
        const page = req.query.page && parseInt(req.query.page, 10);
        const itemsPerPage = req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify([]));
            return;
        }
        try {
            const blocks = await context.db.getBlocksByPlatformAddress(address, { page, itemsPerPage });
            res.send(blocks);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-blocks/:address/totalCount", async (req, res, next) => {
        const { address } = req.params;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify(0));
            return;
        }
        try {
            const count = await context.db.getTotalBlockCountByPlatformAddress(address);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-parcels/:address", async (req, res, next) => {
        const { address } = req.params;
        const page = req.query.page && parseInt(req.query.page, 10);
        const itemsPerPage = req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify([]));
            return;
        }
        try {
            const parcels = await context.db.getParcelsByPlatformAddress(address, { page, itemsPerPage });
            res.send(parcels);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-parcels/:address/totalCount", async (req, res, next) => {
        const { address } = req.params;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify(0));
            return;
        }
        try {
            const count = await context.db.getTotalParcelCountByPlatformAddress(address);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-asset-txs/:address", async (req, res, next) => {
        const { address } = req.params;
        const page = req.query.page && parseInt(req.query.page, 10);
        const itemsPerPage = req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
        const onlyUnconfirmed = req.query.onlyUnconfirmed;
        const confirmThreshold = req.query.confirmThreshold != undefined ? parseInt(req.query.confirmThreshold, 10) : 5;
        try {
            AssetTransferAddress.fromString(address);
        } catch (e) {
            res.send([]);
            return;
        }
        try {
            let currentBestBlockNumber = 0;
            if (onlyUnconfirmed === "true") {
                currentBestBlockNumber = await context.db.getLastBlockNumber();
            }
            const transactions: TransactionDoc[] = await context.db.getTransactionsByAssetTransferAddress(address, {
                page,
                itemsPerPage,
                onlyUnconfirmed: onlyUnconfirmed === "true",
                currentBestBlockNumber,
                confirmThreshold
            });
            res.send(transactions);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-asset-txs/pending/:address", async (req, res, next) => {
        const { address } = req.params;
        try {
            const pendingTxs = await context.db.getPendingTransactionsByAddress(address);
            res.send(pendingTxs);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-asset-txs/:address/totalCount", async (req, res, next) => {
        const { address } = req.params;
        try {
            AssetTransferAddress.fromString(address);
        } catch (e) {
            res.send([]);
            return;
        }
        try {
            const count = await context.db.getTotalTxCountByAssetTransferAddress(address);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
}

export const AddressAction = {
    handle
};
