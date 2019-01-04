import { Router } from "express";
import { IndexerContext } from "../context";
import * as Exception from "../exception";

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: Account management
 */
export function handle(_C: IndexerContext, router: Router) {
    /**
     * @swagger
     * /account/:address:
     *   get:
     *     summary: Returns account of the specific address (Not implemented)
     *     tags: [Account]
     *     responses:
     *       200:
     *         description: account
     *         schema:
     *           type: object
     *           properties:
     *             balance:
     *               type: string
     *               example: "9999999999"
     *             nonce:
     *               type: number
     *               example: 1231
     */
    router.get("/account/:assetType", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /account:
     *   get:
     *     summary: Returns all accounts (Not implemented)
     *     tags: [Account]
     *     parameters:
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
     *         description: account
     *         schema:
     *           type: array
     *           items:
     *             type: object
     *             properties:
     *               balance:
     *                 type: string
     *                 example: "9999999999"
     *               nonce:
     *                 type: number
     *                 example: 1231
     */
    router.get("/account", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });
}
