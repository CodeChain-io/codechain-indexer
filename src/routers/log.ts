import { Router } from "express";
import { IndexerContext } from "../context";
import { LogType } from "../models/log";
import * as LogModel from "../models/logic/log";

/**
 * @swagger
 * tags:
 *   name: Log
 *   description: Log management
 */
export function handle(_C: IndexerContext, router: Router) {
    /**
     * @swagger
     * /log/count:
     *   get:
     *     summary: Returns the number of either block or transaction
     *     tags: [Log]
     *     parameters:
     *       - name: filter
     *         description: block, tx, pay, setRegularKey, setShardOwner, setShardUser, createShard, mintAsset, transferAsset, composeAsset, decomposeAsset, changeAssetScheme, store, remove, custom, wrapCCC, unwrapCCC
     *         in: query
     *         required: true
     *         type: string
     *       - name: date
     *         description: (YYYY-MM-DD format)
     *         in: query
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: return the number of either block or transaction
     *         schema:
     *           type: number
     *       400:
     *         description: either filter or date is invalid
     */
    router.get("/log/count", async (req, res) => {
        const filter = req.query.filter;
        const date = req.query.date;
        if (!isFilterValid(filter)) {
            res.status(400).send();
            return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            res.status(400).send();
            return;
        }
        LogModel.getLog(date, getLogTypeFromFilter(filter), null)
            .then(instance => {
                if (instance == null) {
                    res.json(0);
                    return;
                }
                res.json(instance.get().count);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send();
            });
    });

    /**
     * @swagger
     * /log/miners:
     *   get:
     *     summary: Returns the list of the block miners
     *     tags: [Log]
     *     parameters:
     *       - name: date
     *         description: (YYYY-MM-DD format)
     *         in: query
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: return a list of address and count pair. The list is sorted by the count in descending order.
     *       400:
     *         description: date is invalid
     */
    router.get("/log/miners", async (req, res, next) => {
        const date = req.query.date;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            res.status(400).send();
            return;
        }
        LogModel.getMiningCountLogs(date, 5)
            .then(logs => {
                res.json(
                    logs.map(log => ({ address: log.value, count: log.count }))
                );
            })
            .catch(err => {
                console.error(err);
                next(err);
            });
    });
}

const isFilterValid = (filter: string): boolean => {
    return (
        [
            "block",
            "tx",
            "pay",
            "setRegularKey",
            "setShardOwner",
            "setShardUser",
            "createShard",
            "mintAsset",
            "transferAsset",
            "composeAsset",
            "decomposeAsset",
            "changeAssetScheme",
            "store",
            "remove",
            "custom",
            "wrapCCC",
            "unwrapCCC"
        ].findIndex(type => type.toLowerCase() === filter.toLowerCase()) >= 0
    );
};

const getLogTypeFromFilter = (filter: string): LogType => {
    switch (filter.toLowerCase()) {
        case "block".toLowerCase():
            return LogType.BLOCK_COUNT;
        case "tx".toLowerCase():
            return LogType.TX_COUNT;
        case "pay".toLowerCase():
            return LogType.PAY_COUNT;
        case "setRegularKey".toLowerCase():
            return LogType.SET_REGULAR_KEY_COUNT;
        case "setShardOwner".toLowerCase():
            return LogType.SET_SHARD_OWNER_COUNT;
        case "setShardUser".toLowerCase():
            return LogType.SET_SHARD_USER_COUNT;
        case "createShard".toLowerCase():
            return LogType.CREATE_SHARD_COUNT;
        case "mintAsset".toLowerCase():
            return LogType.MINT_ASSET_COUNT;
        case "transferAsset".toLowerCase():
            return LogType.TRANSFER_ASSET_COUNT;
        case "composeAsset".toLowerCase():
            return LogType.COMPOSE_ASSET_COUNT;
        case "decomposeAsset".toLowerCase():
            return LogType.DECOMPOSE_ASSET_COUNT;
        case "changeAssetScheme".toLowerCase():
            return LogType.CHANGE_ASSET_SCHEME_COUNT;
        case "store".toLowerCase():
            return LogType.STORE_COUNT;
        case "remove".toLowerCase():
            return LogType.REMOVE_COUNT;
        case "custom".toLowerCase():
            return LogType.CUSTOM_COUNT;
        case "wrapCCC".toLowerCase():
            return LogType.WRAP_CCC_COUNT;
        case "unwrapCCC".toLowerCase():
            return LogType.UNWRAP_CCC_COUNT;
        default:
            throw Error(`Unexpected filter ${filter}`);
    }
};
