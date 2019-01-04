import { Router } from "express";
import { IndexerContext } from "../context";
import * as Exception from "../exception";

/**
 * @swagger
 * tags:
 *   name: Asset
 *   description: Asset management
 * definitions:
 *   UTXO:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: UTXO example
 *   AssetScheme:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: AssetScheme example
 *   AggUTXO:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: AggUTXO exampl
 */
export function handle(_C: IndexerContext, router: Router) {
    /**
     * @swagger
     * /utxo-list/:assetType:
     *   get:
     *     summary: Returns utxo of the specific assetType (Not implemented)
     *     tags: [Asset]
     *     parameters:
     *       - name: address
     *         description: filter by owner address
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
     *         description: utxo
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/UTXO'
     */
    router.get("/utxo-list/:assetType", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /asset-scheme/:assetType:
     *   get:
     *     summary: Returns asset scheme of the specific assetType (Not implemented)
     *     tags: [Asset]
     *     responses:
     *       200:
     *         description: asset scheme
     *         schema:
     *           type: object
     *           $ref: '#/definitions/AssetScheme'
     */
    router.get("/asset-scheme/:assetType", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /asset-image/:assetType:
     *   get:
     *     summary: Returns asset image of the specific assetType (Not implemented)
     *     tags: [Asset]
     *     responses:
     *       200:
     *         description: asset image
     *         schema:
     *           type: image
     */
    router.get("/asset-image/:assetType", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /aggs-utxo-list/:address:
     *   get:
     *     summary: Returns aggregated utxo list (Not implemented)
     *     tags: [Asset]
     *     parameters:
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
     *         description: aggregated utxo
     *         schema:
     *           type: object
     *           $ref: '#/definitions/AggsUTXO'
     */
    router.get("/aggs-utxo-list/:address", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /snapshot/:snapshotId:
     *   get:
     *     summary: Returns snapshot (Not implemented)
     *     tags: [Asset]
     *     responses:
     *       200:
     *         description: utxo list
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/UTXO'
     */
    router.get("/snapshot/:snapshotId", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /snapshot-request:
     *   post:
     *     summary: Returns snapshot (Not implemented)
     *     tags: [Asset]
     *     parameters:
     *       - name: assetType
     *         description: assetType for snapshot
     *         in: body
     *         required: true
     *         type: string
     *       - name: date
     *         description: date for snapshot
     *         in: body
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: snapshot Id
     *         schema:
     *           type: object
     *           properties:
     *             snapshotId:
     *               type: string
     */
    router.post("/snapshot-request", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /snapshot-request:
     *   get:
     *     summary: Returns snapshot (Not implemented)
     *     tags: [Asset]
     *     responses:
     *       200:
     *         description: utxo list
     *         schema:
     *           type: array
     *           items:
     *             type: object
     *             properties:
     *               snapshotId:
     *                 type: string
     *               assetType:
     *                 type: string
     *               date:
     *                 type: date
     */
    router.get("/snapshot-request", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });
}
