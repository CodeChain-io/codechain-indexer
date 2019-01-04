import { Router } from "express";
import { IndexerContext } from "../context";
import * as Exception from "../exception";

/**
 * @swagger
 * tags:
 *   name: Block
 *   description: Block management
 * definitions:
 *   Block:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: block example
 */
export function handle(_C: IndexerContext, router: Router) {
    /**
     * @swagger
     * /block/latest:
     *   get:
     *     summary: Returns latest block (Not implemented)
     *     tags: [Block]
     *     responses:
     *       200:
     *         description: latest block
     *         schema:
     *           $ref: '#/definitions/Block'
     */
    router.get("/block/latest", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /block/:hashOrNumber:
     *   get:
     *     summary: Returns specific block (Not implemented)
     *     tags: [Block]
     *     responses:
     *       200:
     *         description: specific block
     *         schema:
     *           $ref: '#/definitions/Block'
     */
    router.get("/block/:hashOrNumber", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /block:
     *   get:
     *     summary: Returns blocks (Not implemented)
     *     tags: [Block]
     *     parameters:
     *       - name: address
     *         description: Author filter by address
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
     *     responses:
     *       200:
     *         description: blocks
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Block'
     */
    router.get("/block", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /block/count:
     *   get:
     *     summary: Returns total count of the blocks (Not implemented)
     *     tags: [Block]
     *     parameters:
     *       - name: address
     *         description: Author filter by address
     *         in: formData
     *         required: false
     *         type: string
     *     responses:
     *       200:
     *         description: total count of the blocks
     *         schema:
     *           type: number
     *           example: 12
     */
    router.get("/block/count", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });
}
