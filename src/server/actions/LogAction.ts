import { Router } from "express";
import { LogType } from "../../es/actions/QueryLog";
import { ServerContext } from "../ServerContext";

function handle(context: ServerContext, router: Router) {
    router.get("/log/blockCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.BLOCK_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/parcelCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.PARCEL_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/txCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.TX_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/bestMiners", async (req, res, next) => {
        const { date } = req.query;
        try {
            const logTypes = await context.db.getBestMiners(date);
            res.send(logTypes);
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/paymentCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.PARCEL_PAYMENT_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/assetTransactionCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.PARCEL_ASSET_TRANSACTION_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/setRegularKeyCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.PARCEL_SET_REGULAR_KEY_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/setShardUserCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.PARCEL_SET_SHARD_USER_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/setShardOwnerCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.PARCEL_SET_SHARD_OWNER_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/createShardCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.PARCEL_CREATE_SHARD_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/mintTxCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.TX_ASSET_MINT_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/transferTxCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.TX_ASSET_TRANSFER_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/composeTxCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.TX_ASSET_COMPOSE_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
    router.get("/log/decomposeTxCount", async (req, res, next) => {
        const { date } = req.query;
        try {
            const count = await context.db.getLogCount(date, LogType.TX_ASSET_DECOMPOSE_COUNT);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
}

export const LogAction = {
    handle
};
