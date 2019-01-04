import { Router } from "express";
import { IndexerContext } from "../context";
import * as Exception from "../exception";

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
     *     summary: Returns latest transactions (Not implemented)
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
    router.get("/tx", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /tx/:hash:
     *   get:
     *     summary: Returns the specific transaction (Not implemented)
     *     tags: [Transaction]
     *     responses:
     *       200:
     *         description: specific transaction
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Transaction'
     */
    router.get("/tx/:hash", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /tx/count:
     *   get:
     *     summary: Returns total count of the transactions (Not implemented)
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
    router.get("/tx/count", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /pending-tx/:hash:
     *   get:
     *     summary: Returns specific pending transaction (Not implemented)
     *     tags: [Transaction]
     *     responses:
     *       200:
     *         description: current pending parcels
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Transaction'
     */
    router.get("/pending-tx/:hash", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /pending-tx:
     *   get:
     *     summary: Returns pending txs (Not implemented)
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
    router.get("/pending-tx", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });
}
