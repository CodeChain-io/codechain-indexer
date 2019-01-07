import { H256 } from "codechain-sdk/lib/core/classes";
import { Router } from "express";
import * as moment from "moment";
import { IndexerContext } from "../context";
import * as Exception from "../exception";
import * as AssetImageModel from "../models/logic/assetimage";
import * as AssetSchemeModel from "../models/logic/assetscheme";
import * as SnapshotModel from "../models/logic/snapshot";
import * as UTXOModel from "../models/logic/utxo";

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
 *   AggsUTXO:
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
     * /utxo:
     *   get:
     *     summary: Returns utxo
     *     tags: [Asset]
     *     parameters:
     *       - name: address
     *         description: filter by owner address
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
     *         description: utxo
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/UTXO'
     */
    router.get("/utxo", async (req, res, next) => {
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
            const utxoInsts = await UTXOModel.getUTXO({
                address,
                assetType,
                page,
                itemsPerPage,
                onlyConfirmed,
                confirmThreshold
            });
            const utxo = utxoInsts.map(inst => inst.get({ plain: true }));
            res.json(utxo);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /asset-scheme/:assetType:
     *   get:
     *     summary: Returns asset scheme of the specific assetType
     *     tags: [Asset]
     *     responses:
     *       200:
     *         description: asset scheme
     *         schema:
     *           type: object
     *           $ref: '#/definitions/AssetScheme'
     */
    router.get("/asset-scheme/:assetType", async (req, res, next) => {
        const assetTypeString = req.params.assetType;
        try {
            const assetType = new H256(assetTypeString);
            const assetSchemeInst = await AssetSchemeModel.getByAssetType(
                assetType
            );
            res.json(
                assetSchemeInst ? assetSchemeInst.get({ plain: true }) : null
            );
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /asset-image/:assetType:
     *   get:
     *     summary: Returns asset image of the specific assetType
     *     tags: [Asset]
     *     responses:
     *       200:
     *         description: asset image
     *         schema:
     *           type: image
     */
    router.get("/asset-image/:assetType", async (req, res, next) => {
        const assetTypeString = req.params.assetType;
        try {
            const assetType = new H256(assetTypeString);
            const assetImageInst = await AssetImageModel.getByAssetType(
                assetType
            );
            if (!assetImageInst) {
                res.status(404).send("Not found");
                return;
            }
            const img = Buffer.from(assetImageInst.get().image, "base64");
            res.writeHead(200, {
                "Content-Type": "image/png",
                "Content-Length": img.length
            });
            res.end(img);
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
     *       - name: address
     *         description: filter by address
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
     *         description: aggregated utxo
     *         schema:
     *           type: object
     *           $ref: '#/definitions/AggsUTXO'
     */
    router.get("/aggs-utxo", async (req, res, next) => {
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
            const aggsInst = await UTXOModel.getAggsUTXO({
                address,
                assetType,
                page,
                itemsPerPage,
                onlyConfirmed,
                confirmThreshold
            });
            const utxo = aggsInst.map(inst => inst.get({ plain: true }));
            res.json(utxo);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /aggs-utxo/count:
     *   get:
     *     summary: Returns aggregated utxo list (Not implemented)
     *     tags: [Asset]
     *     parameters:
     *       - name: address
     *         description: filter by address
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
     *         description: aggregated utxo
     *         schema:
     *           type: object
     *           $ref: '#/definitions/AggsUTXO'
     */
    router.get("/aggs-utxo/count", async (req, res, next) => {
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
            const count = await UTXOModel.getCountOfAggsUTXO({
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
     * /snapshot/:snapshotId:
     *   get:
     *     summary: Returns snapshot
     *     tags: [Asset]
     *     responses:
     *       200:
     *         description: utxo list
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/UTXO'
     */
    router.get("/snapshot/:snapshotId", async (req, res, next) => {
        const snapshotId = req.params.snapshotId;
        try {
            const snapshotInst = await SnapshotModel.getUTXOSnapshotBySnapshotId(
                snapshotId
            );
            res.json(snapshotInst ? snapshotInst.get({ plain: true }) : null);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /snapshot-request:
     *   post:
     *     summary: Returns snapshot
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
    router.post("/snapshot-request", async (req, res, next) => {
        const assetTypeString = req.query.assetType;
        const date = req.query.date;
        try {
            const assetType = new H256(assetTypeString);
            if (!moment(date).isValid()) {
                throw Exception.InvalidDateParam;
            }
            const unixTimestamp = moment(date).unix();
            const snapshotInst = await SnapshotModel.createSnapshotRequests(
                assetType,
                unixTimestamp
            );
            res.json(snapshotInst ? snapshotInst.get().id : null);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /snapshot-request:
     *   get:
     *     summary: Returns snapshot
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
    router.get("/snapshot-request", async (_, res, next) => {
        try {
            const snapshotInsts = await SnapshotModel.getSnapshotRequests();
            const snapshotRequests = snapshotInsts.map(inst =>
                inst.get({ plain: true })
            );
            res.json(snapshotRequests);
        } catch (e) {
            next(e);
        }
    });
}
