import { H160, H256 } from "codechain-primitives/lib";
import { Router } from "express";
import * as Joi from "joi";
import { IndexerContext } from "../context";
import * as TxModel from "../models/logic/transaction";
import {
    parseEvaluatedKey,
    syncIfNeeded
} from "../models/logic/utils/middleware";
import { createPaginationResult } from "./pagination";
import {
    paginationSchema,
    pendingTxSchema,
    txPaginationSchema,
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
     *       - name: firstEvaluatedKey
     *         description: the evaulated key of the first item in the previous page. It will be used for the pagination
     *         in: query
     *         required: false
     *         type: string
     *       - name: lastEvaluatedKey
     *         description: the evaulated key of the last item in the previous page. It will be used for the pagination
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
        parseEvaluatedKey,
        validate({
            query: {
                ...txSchema,
                ...paginationSchema,
                ...txPaginationSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const address = req.query.address;
            const assetTypeString = req.query.assetType;
            const type = req.query.type;
            const page = (req.query.page && parseInt(req.query.page, 10)) || 1;
            const itemsPerPage =
                (req.query.itemsPerPage &&
                    parseInt(req.query.itemsPerPage, 10)) ||
                15;
            const includePending = req.query.includePending;
            const onlyConfirmed = req.query.onlyConfirmed;
            const confirmThreshold =
                req.query.confirmThreshold &&
                parseInt(req.query.confirmThreshold, 10);
            const firstEvaluatedKey = req.query.firstEvaluatedKey;
            const lastEvaluatedKey = req.query.lastEvaluatedKey;
            try {
                const txInsts = await TxModel.getTransactions({
                    address,
                    assetType:
                        assetTypeString && H160.ensure(assetTypeString).value,
                    type:
                        typeof type === "string" ? type.split(",") : undefined,
                    page,
                    itemsPerPage: itemsPerPage + 1,
                    firstEvaluatedKey,
                    lastEvaluatedKey,
                    includePending,
                    onlyConfirmed,
                    confirmThreshold
                });
                const txs = txInsts.map(tx => tx.get({ plain: true }));
                res.json(
                    createPaginationResult({
                        query: {
                            firstEvaluatedKey,
                            lastEvaluatedKey
                        },
                        rows: txs,
                        getEvaluatedKey: TxModel.createTxEvaluatedKey,
                        itemsPerPage
                    })
                );
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /tx/fee-stats:
     *   get:
     *     summary: Returns the statistics of transaction fee of latest 200 transactions for each transaction type
     *     tags: [Transaction]
     *     responses:
     *       200:
     *         description: The average, min, max value of fees of Pay and TransferAsset transactions.
     *         schema:
     *           type: object
     *           example: {
     *             "pay": { "avg": "100", "min": "100", "max": "100" },
     *             "transferAsset": { "avg": "100", "min": "100", "max": "100" }
     *           }
     */
    router.get("/tx/fee-stats", async (__, res, next) => {
        try {
            const samples = 200;
            const payFees = await TxModel.getTransactions({
                type: ["pay"],
                page: 1,
                itemsPerPage: samples,
                firstEvaluatedKey: null,
                lastEvaluatedKey: null
            }).then(txs => txs.map(tx => tx.get().fee));
            const transferAssetFees = await TxModel.getTransactions({
                type: ["transferAsset"],
                page: 1,
                itemsPerPage: samples,
                firstEvaluatedKey: null,
                lastEvaluatedKey: null
            }).then(txs => txs.map(tx => tx.get().fee));
            res.json({
                pay: payFees,
                transferAsset: transferAssetFees
            });
        } catch (e) {
            next(e);
        }
    });

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
            const page = req.query.page || 1;
            const itemsPerPage = req.query.itemsPerPage || 15;
            try {
                const pendingTxInsts = await TxModel.getPendingTransactions({
                    address,
                    assetType:
                        assetTypeString && H160.ensure(assetTypeString).value,
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
}
