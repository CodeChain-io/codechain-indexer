import { Router } from "express";
import { IndexerContext } from "../context";
import * as Exception from "../exception";

/**
 * @swagger
 * tags:
 *   name: Status
 *   description: Status management
 */
export function handle(_C: IndexerContext, router: Router) {
    /**
     * @swagger
     * /ping:
     *   get:
     *     summary: Returns pong (Not implemented)
     *     tags: [Status]
     *     responses:
     *       200:
     *         description: pong
     *         schema:
     *           type: string
     *           example: pong
     */
    router.get("/ping", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /status/codechain:
     *   get:
     *     summary: Returns status of the codechain (Not implemented)
     *     tags: [Status]
     *     responses:
     *       200:
     *         description: codechain status
     *         schema:
     *           type: object
     *           properties:
     *             nodeVersion:
     *               type: string
     *               example: "0.1.0"
     *             commitHash:
     *               type: string
     *               example: "c76ef861a4d4e93057b84425f996e9cd9e1a3b88"
     *             networkId:
     *               type: string
     *               example: "tc"
     *             peerCount:
     *               type: number
     *               example: 5
     *             peers:
     *               type: array
     *               example: []
     *             whiteList:
     *               type: object
     *               example: {}
     *             blackList:
     *               type: object
     *               example: {}
     */
    router.get("/status/codechain", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /status/sync:
     *   get:
     *     summary: Returns sync status (Not implemented)
     *     tags: [Status]
     *     responses:
     *       200:
     *         description: sync status
     *         schema:
     *           type: object
     *           properties:
     *             codechainBestBlockNumber:
     *               type: number
     *               example: 5555
     *             codechainBestBlockHash:
     *               type: string
     *               example: "c76ef861a4d4e93057b84425f996e9cd9e1a3b88"
     *             explorerLastBlockNumber:
     *               type: number
     *               example: 5555
     *             explorerLastBlockHash:
     *               type: string
     *               example: "c76ef861a4d4e93057b84425f996e9cd9e1a3b88"
     */
    router.get("/status/sync", async (_A, _B, next) => {
        try {
            throw Exception.NotImplmeneted;
        } catch (e) {
            next(e);
        }
    });
}
