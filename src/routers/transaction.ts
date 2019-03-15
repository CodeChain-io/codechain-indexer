import { H160, H256 } from "codechain-primitives/lib";
import { Router } from "express";
import * as Joi from "joi";
import { IndexerContext } from "../context";
import * as TxModel from "../models/logic/transaction";
import { syncIfNeeded } from "../models/logic/utils/middleware";
import {
    paginationSchema,
    pendingTxSchema,
    txSchema,
    validate
} from "./validator";

/**
 * @swagger
 * tags:
 *   name: Transaction
 *   description: Transaction management
 * definitions:
 *   Transaction:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: Transaction example
 */
export function handle(context: IndexerContext, router: Router) {
    /**
     * @swagger
     * /tx:
     *   get:
     *     summary: Returns latest transactions
     *     tags: [Transaction]
     *     parameters:
     *       - name: address
     *         description: sender, receiver, input, output, shard user, shard owner filter by address
     *         in: query
     *         required: false
     *         type: string
     *       - name: assetType
     *         description: filter by assetType
     *         in: query
     *         required: false
     *         type: string
     *       - name: tracker
     *         description: filter by tracker
     *         in: query
     *         required: false
     *         type: string
     *       - name: type
     *         description: filter by type such as mintAsset, transferAsset, etc. Multiple types can be given by comma separating.
     *         in: query
     *         required: false
     *         type: string
     *       - name: page
     *         description: page for the pagination
     *         in: query
     *         required: false
     *         type: number
     *       - name: itemsPerPage
     *         description: items per page for the pagination
     *         in: query
     *         required: false
     *         type: number
     *       - name: includePending
     *         description: If true, the results include pending transactions. Pending transactions are ahead of confirmed transactions in terms of order.
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: onlyConfirmed
     *         description: returns only confirmed component
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: onlySuccessful
     *         description: returns only successful transactions
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: confirmThreshold
     *         description: confirm threshold
     *         in: query
     *         required: false
     *         type: number
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: latest transactions
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Transaction'
     */
    router.get(
        "/tx",
        validate({
            query: {
                ...txSchema,
                ...paginationSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const address = req.query.address;
            const assetTypeString = req.query.assetType;
            const type = req.query.type;
            const trackerString = req.query.tracker;
            const page = req.query.page && parseInt(req.query.page, 10);
            const itemsPerPage =
                req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
            const includePending = req.query.includePending;
            const onlyConfirmed = req.query.onlyConfirmed;
            const onlySuccessful = req.query.onlySuccessful;
            const confirmThreshold =
                req.query.confirmThreshold &&
                parseInt(req.query.confirmThreshold, 10);
            let assetType;
            let tracker;
            try {
                if (assetTypeString) {
                    assetType = new H160(assetTypeString);
                }
                if (trackerString) {
                    tracker = new H256(trackerString);
                }
                const txInsts = await TxModel.getTransactions({
                    address,
                    assetType,
                    type:
                        typeof type === "string" ? type.split(",") : undefined,
                    tracker,
                    page,
                    itemsPerPage,
                    includePending,
                    onlyConfirmed,
                    onlySuccessful,
                    confirmThreshold
                });
                const txs = txInsts.map(tx => tx.get({ plain: true }));
                res.json(txs);
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /tx/count:
     *   get:
     *     summary: Returns total count of the transactions
     *     tags: [Transaction]
     *     parameters:
     *       - name: address
     *         description: sender, receiver, input, output, shard user, shard owner filter by address
     *         in: query
     *         required: false
     *         type: string
     *       - name: assetType
     *         description: filter by assetType
     *         in: query
     *         required: false
     *         type: string
     *       - name: tracker
     *         description: filter by tracker
     *         in: query
     *         required: false
     *         type: string
     *       - name: type
     *         description: filter by type such as mintAsset, transferAsset, etc. Multiple types can be given by comma separating.
     *         in: query
     *         required: false
     *         type: string
     *       - name: includePending
     *         description: If true, the results include pending transactions. Pending transactions are ahead of confirmed transactions in terms of order.
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: onlyConfirmed
     *         description: returns only confirmed component
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: onlySuccessful
     *         description: returns only successful transactions
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: confirmThreshold
     *         description: confirm threshold
     *         in: query
     *         required: false
     *         type: number
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: total count of the transactions
     *         schema:
     *           type: number
     *           example: 24
     */
    router.get(
        "/tx/count",
        validate({
            query: { ...txSchema }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const address = req.query.address;
            const assetTypeString = req.query.assetType;
            const type = req.query.type;
            const trackerString = req.query.tracker;
            const includePending = req.query.includePending;
            const onlyConfirmed = req.query.onlyConfirmed;
            const onlySuccessful = req.query.onlySuccessful;
            const confirmThreshold =
                req.query.confirmThreshold &&
                parseInt(req.query.confirmThreshold, 10);
            let assetType;
            let tracker;
            try {
                if (assetTypeString) {
                    assetType = new H160(assetTypeString);
                }
                if (trackerString) {
                    tracker = new H256(trackerString);
                }
                const count = await TxModel.getNumberOfTransactions({
                    address,
                    assetType,
                    type:
                        typeof type === "string" ? type.split(",") : undefined,
                    tracker,
                    includePending,
                    onlyConfirmed,
                    onlySuccessful,
                    confirmThreshold
                });
                res.json(count);
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /tx/{hash}:
     *   get:
     *     summary: Returns the specific transaction
     *     tags: [Transaction]
     *     parameters:
     *       - name: hash
     *         description: Transaction hash
     *         required: true
     *         in: path
     *         type: string
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: specific transaction
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Transaction'
     */
    router.get(
        "/tx/:hash",
        validate({
            params: {
                hash: Joi.string().regex(/^(0x)?[0-9a-f]{64}$/)
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const hashString = req.params.hash;
            try {
                const hash = new H256(hashString);
                const txInst = await TxModel.getByHash(hash);
                res.json(txInst ? txInst.get({ plain: true }) : null);
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /pending-tx:
     *   get:
     *     summary: Returns pending txs
     *     tags: [Transaction]
     *     parameters:
     *       - name: address
     *         description: sender, receiver, input, output, shard user, shard owner filter by address
     *         in: query
     *         required: false
     *         type: string
     *       - name: assetType
     *         description: filter by assetType
     *         in: query
     *         required: false
     *         type: string
     *       - name: type
     *         description: filter by type such as mintAsset, transferAsset, etc. Multiple types can be given by comma separating.
     *         in: query
     *         required: false
     *         type: string
     *       - name: page
     *         description: page for the pagination
     *         in: query
     *         required: false
     *         type: number
     *       - name: itemsPerPage
     *         description: items per page for the pagination
     *         in: query
     *         required: false
     *         type: number
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: pending transactions
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Transaction'
     */
    router.get(
        "/pending-tx",
        validate({
            query: {
                ...pendingTxSchema,
                ...paginationSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const address = req.query.address;
            const assetTypeString = req.query.assetType;
            const type = req.query.type;
            const page = req.query.page;
            const itemsPerPage = req.query.itemsPerPage;
            try {
                let assetType;
                if (assetTypeString) {
                    assetType = new H160(assetTypeString);
                }
                const pendingTxInsts = await TxModel.getPendingTransactions({
                    address,
                    assetType,
                    type:
                        typeof type === "string" ? type.split(",") : undefined,
                    page,
                    itemsPerPage
                });
                const pendingTxs = pendingTxInsts.map(tx =>
                    tx.get({ plain: true })
                );
                res.json(pendingTxs);
            } catch (e) {
                next(e);
            }
        }
    );
    /**
     * @swagger
     * /pending-tx/count:
     *   get:
     *     summary: Returns pending txs count
     *     tags: [Transaction]
     *     parameters:
     *       - name: address
     *         description: input, output, shard user, shard owner filter by address
     *         in: query
     *         required: false
     *         type: string
     *       - name: assetType
     *         description: filter by assetType
     *         in: query
     *         required: false
     *         type: string
     *       - name: type
     *         description: filter by type such as mintAsset, transferAsset, etc. Multiple types can be given by comma separating.
     *         in: query
     *         required: false
     *         type: string
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: pending transactions count
     *         schema:
     *           type: number
     *           example: 12
     */
    router.get(
        "/pending-tx/count",
        validate({
            query: {
                ...pendingTxSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const address = req.query.address;
            const assetTypeString = req.query.assetType;
            const type = req.query.type;
            try {
                let assetType;
                if (assetTypeString) {
                    assetType = new H160(assetTypeString);
                }
                const count = await TxModel.getNumberOfPendingTransactions({
                    address,
                    assetType,
                    type: typeof type === "string" ? type.split(",") : undefined
                });
                res.json(count);
            } catch (e) {
                next(e);
            }
        }
    );
}
