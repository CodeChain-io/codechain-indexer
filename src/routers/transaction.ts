import { H256 } from "codechain-primitives/lib";
import { Router } from "express";
import { IndexerContext } from "../context";
import * as TransactionModel from "../models/logic/transaction";

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
export function handle(_C: IndexerContext, router: Router) {
    /**
     * @swagger
     * /tx:
     *   get:
     *     summary: Returns latest transactions
     *     tags: [Transaction]
     *     parameters:
     *       - name: address
     *         description: input, output, shard user, shard owner filter by address
     *         in: formData
     *         required: false
     *         type: string
     *       - name: assetType
     *         description: filter by assetType
     *         in: formData
     *         required: false
     *         type: string
     *       - name: page
     *         description: page for the pagination
     *         in: formData
     *         required: false
     *         type: number
     *       - name: itemsPerPage
     *         description: items per page for the pagination
     *         in: formData
     *         required: false
     *         type: number
     *       - name: onlyConfirmed
     *         description: returns only confirmed component
     *         in: formData
     *         required: false
     *         type: boolean
     *       - name: confirmThreshold
     *         description: confirm threshold
     *         in: formData
     *         required: false
     *         type: number
     *     responses:
     *       200:
     *         description: latest transactions
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Transaction'
     */
    router.get("/tx", async (req, res, next) => {
        const address = req.query.address;
        const assetTypeString = req.query.assetType;
        const page = req.query.page && parseInt(req.query.page, 10);
        const itemsPerPage =
            req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
        const onlyConfirmed =
            req.query.onlyConfirmed && req.query.onlyConfirmed === "true";
        const confirmThreshold =
            req.query.confirmThreshold &&
            parseInt(req.query.confirmThreshold, 10);
        let assetType;
        try {
            if (assetTypeString) {
                assetType = new H256(assetTypeString);
            }
            const txInsts = await TransactionModel.getTransactions({
                address,
                assetType,
                page,
                itemsPerPage,
                onlyConfirmed,
                confirmThreshold
            });
            const txs = txInsts.map(tx => tx.get({ plain: true }));
            res.json(txs);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /tx/count:
     *   get:
     *     summary: Returns total count of the transactions
     *     tags: [Transaction]
     *     parameters:
     *       - name: address
     *         description: input, output, shard user, shard owner filter by address
     *         in: formData
     *         required: false
     *         type: string
     *       - name: assetType
     *         description: filter by assetType
     *         in: formData
     *         required: false
     *         type: string
     *       - name: onlyConfirmed
     *         description: returns only confirmed component
     *         in: formData
     *         required: false
     *         type: boolean
     *       - name: confirmThreshold
     *         description: confirm threshold
     *         in: formData
     *         required: false
     *         type: number
     *     responses:
     *       200:
     *         description: total count of the transactions
     *         schema:
     *           type: number
     *           example: 24
     */
    router.get("/tx/count", async (req, res, next) => {
        const address = req.query.address;
        const assetTypeString = req.query.assetType;
        const onlyConfirmed =
            req.query.onlyConfirmed && req.query.onlyConfirmed === "true";
        const confirmThreshold =
            req.query.confirmThreshold &&
            parseInt(req.query.confirmThreshold, 10);
        let assetType;
        try {
            if (assetTypeString) {
                assetType = new H256(assetTypeString);
            }
            const count = await TransactionModel.getCountOfTransactions({
                address,
                assetType,
                onlyConfirmed,
                confirmThreshold
            });
            res.json(count);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /tx/:hash:
     *   get:
     *     summary: Returns the specific transaction
     *     tags: [Transaction]
     *     responses:
     *       200:
     *         description: specific transaction
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Transaction'
     */
    router.get("/tx/:hash", async (req, res, next) => {
        const hashString = req.params.hash;
        try {
            const hash = new H256(hashString);
            const txInst = await TransactionModel.getByHash(hash);
            res.json(txInst ? txInst.get({ plain: true }) : null);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /pending-tx:
     *   get:
     *     summary: Returns pending txs
     *     tags: [Transaction]
     *     parameters:
     *       - name: address
     *         description: input, output, shard user, shard owner filter by address
     *         in: formData
     *         required: false
     *         type: string
     *       - name: assetType
     *         description: filter by assetType
     *         in: formData
     *         required: false
     *         type: string
     *     responses:
     *       200:
     *         description: pending transactions
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Transaction'
     */
    router.get("/pending-tx", async (req, res, next) => {
        const address = req.query.address;
        const assetTypeString = req.query.assetType;
        try {
            const assetType = new H256(assetTypeString);
            const pendingTxInsts = await TransactionModel.getPendingTransactions(
                {
                    address,
                    assetType
                }
            );
            const pendingTxs = pendingTxInsts.map(tx =>
                tx.get({ plain: true })
            );
            res.json(pendingTxs);
        } catch (e) {
            next(e);
        }
    });
    /**
     * @swagger
     * /pending-tx/count:
     *   get:
     *     summary: Returns pending txs count
     *     tags: [Transaction]
     *     parameters:
     *       - name: address
     *         description: input, output, shard user, shard owner filter by address
     *         in: formData
     *         required: false
     *         type: string
     *       - name: assetType
     *         description: filter by assetType
     *         in: formData
     *         required: false
     *         type: string
     *     responses:
     *       200:
     *         description: pending transactions count
     *         schema:
     *           type: number
     *           example: 12
     */
    router.get("/pending-tx/count", async (req, res, next) => {
        const address = req.query.address;
        const assetTypeString = req.query.assetType;
        try {
            const assetType = new H256(assetTypeString);
            const count = await TransactionModel.getCountOfPendingTransactions({
                address,
                assetType
            });
            res.json(count);
        } catch (e) {
            next(e);
        }
    });
}
