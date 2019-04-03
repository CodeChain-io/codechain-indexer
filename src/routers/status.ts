import { Router } from "express";
import { SERVICE_UNAVAILABLE } from "http-status-codes";
import moment = require("moment");
import { IndexerContext } from "../context";
import * as BlockModel from "../models/logic/block";
/**
 * @swagger
 * tags:
 *   name: Status
 *   description: Status management
 */
export function handle(context: IndexerContext, router: Router) {
    /**
     * @swagger
     * /ping:
     *   get:
     *     summary: Returns pong
     *     tags: [Status]
     *     responses:
     *       200:
     *         description: pong
     *         schema:
     *           type: string
     *           example: pong
     */
    router.get("/ping", async (_, res, next) => {
        try {
            const pong = await context.sdk.rpc.node.ping();
            res.json(pong);
        } catch (e) {
            const error = e as Error;
            if (error.message.search(/ECONNRESET|ECONNREFUSED/) >= 0) {
                res.status(SERVICE_UNAVAILABLE).send();
            } else {
                next(e);
            }
        }
    });

    /**
     * @swagger
     * /status/codechain:
     *   get:
     *     summary: Returns status of the codechain
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
    router.get("/status/codechain", async (_, res, next) => {
        try {
            const nodeVersion = await context.sdk.rpc.node.getNodeVersion();
            const commitHash = await context.sdk.rpc.node.getCommitHash();
            const networkId = await context.sdk.rpc.chain.getNetworkId();
            const peerCount = await context.sdk.rpc.network.getPeerCount();
            const peers = await context.sdk.rpc.network.getPeers();
            const whiteList = await context.sdk.rpc.network.getWhitelist();
            const blackList = await context.sdk.rpc.network.getBlacklist();
            res.json({
                nodeVersion,
                commitHash,
                networkId,
                peerCount,
                peers,
                whiteList,
                blackList
            });
        } catch (e) {
            const error = e as Error;
            if (error.message.search(/ECONNRESET|ECONNREFUSED/) >= 0) {
                res.status(SERVICE_UNAVAILABLE).send();
            } else {
                next(e);
            }
        }
    });

    /**
     * @swagger
     * /status/sync:
     *   get:
     *     summary: Returns sync status
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
     *             indexedBlockNumber:
     *               type: number
     *               example: 5555
     *             indexedBlockHash:
     *               type: string
     *               example: "c76ef861a4d4e93057b84425f996e9cd9e1a3b88"
     */
    router.get("/status/sync", async (_, res, next) => {
        try {
            const latestBlockInst = await BlockModel.getLatestBlock();
            const codechainBestBlockNumber = await context.sdk.rpc.chain.getBestBlockNumber();
            const codechainBestBlock = await context.sdk.rpc.chain.getBlock(
                codechainBestBlockNumber
            );
            res.json({
                codechainBestBlockNumber,
                codechainBestBlockHash: codechainBestBlock
                    ? codechainBestBlock.hash.value
                    : null,
                indexedBlockNumber: latestBlockInst
                    ? latestBlockInst.get().number
                    : 0,
                indexedBlockHash: latestBlockInst
                    ? latestBlockInst.get().hash
                    : null,
                serverTime: moment().unix()
            });
        } catch (e) {
            const error = e as Error;
            if (error.message.search(/ECONNRESET|ECONNREFUSED/) >= 0) {
                res.status(SERVICE_UNAVAILABLE).send();
            } else {
                next(e);
            }
        }
    });
}
