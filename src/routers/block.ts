import { H256 } from "codechain-primitives/lib";
import { Router } from "express";
import * as _ from "lodash";
import { IndexerContext } from "../context";
import * as BlockModel from "../models/logic/block";
import * as TransactionModel from "../models/logic/transaction";
import { syncIfNeeded } from "../models/logic/utils/middleware";
import {
    blockSchema,
    paginationSchema,
    syncSchema,
    validate
} from "./validator";

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
export function handle(context: IndexerContext, router: Router) {
    /**
     * @swagger
     * /block/latest:
     *   get:
     *     summary: Returns latest block
     *     tags: [Block]
     *     parameters:
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *       - name: sync
     *         description: wait for sync
     *         in: query
     *         required: false
     *         type: boolean
     *     responses:
     *       200:
     *         description: latest block
     *         schema:
     *           $ref: '#/definitions/Block'
     */
    router.get(
        "/block/latest",
        validate({
            query: {
                ...syncSchema
            }
        }),
        syncIfNeeded(context),
        async (_A, res, next) => {
            try {
                const latestBlockInst = await BlockModel.getLatestBlock();
                res.json(
                    latestBlockInst
                        ? latestBlockInst.get({ plain: true })
                        : null
                );
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /block/count:
     *   get:
     *     summary: Returns total count of the blocks
     *     tags: [Block]
     *     parameters:
     *       - name: address
     *         description: Author filter by address
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
     *         description: total count of the blocks
     *         schema:
     *           type: number
     *           example: 12
     */
    router.get(
        "/block/count",
        validate({
            query: {
                ...blockSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const address = req.query.address;
            try {
                const count = await BlockModel.getNumberOfBlocks({
                    address
                });
                res.json(count);
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /block/{hashOrNumber}:
     *   get:
     *     summary: Returns specific block
     *     tags: [Block]
     *     parameters:
     *       - name: hashOrNumber
     *         description: Block hash or Block number
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
     *         description: specific block
     *         schema:
     *           $ref: '#/definitions/Block'
     */
    router.get(
        "/block/:hashOrNumber",
        validate({
            query: {
                ...syncSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const hashOrNumber = req.params.hashOrNumber;
            let hashValue;
            let numberValue;
            // FIXME: Throw an error if hashOrNumber is not hash or number
            try {
                hashValue = new H256(hashOrNumber);
            } catch (e) {
                if (!isNaN(hashOrNumber)) {
                    numberValue = parseInt(hashOrNumber, 10);
                }
            }
            try {
                let latestBlockInst;
                if (hashValue) {
                    latestBlockInst = await BlockModel.getByHash(hashValue);
                } else if (numberValue !== undefined) {
                    latestBlockInst = await BlockModel.getByNumber(numberValue);
                }
                res.json(
                    latestBlockInst
                        ? latestBlockInst.get({ plain: true })
                        : null
                );
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /block/{hashOrNumber}/tx:
     *   get:
     *     summary: Returns the transactions of the specific block
     *     tags: [Block]
     *     parameters:
     *       - name: hashOrNumber
     *         description: Block hash or Block number
     *         required: true
     *         in: path
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
     *     responses:
     *       200:
     *         description: Transactions
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Transaction'
     */
    router.get(
        "/block/:hashOrNumber/tx",
        validate({
            // FIXME: Throw an error if hashOrNumber is not hash or number
            query: {
                ...paginationSchema
            }
        }),
        async (req, res, next) => {
            const hashOrNumber = req.params.hashOrNumber;
            const page = (req.query.page && parseInt(req.query.page, 10)) || 1;
            const itemsPerPage =
                (req.query.itemsPerPage &&
                    parseInt(req.query.itemsPerPage, 10)) ||
                15;

            try {
                const block =
                    H256.check(hashOrNumber) &&
                    (await BlockModel.getByHash(new H256(hashOrNumber)));
                const txs = await TransactionModel.getTransactionsOfBlock({
                    page,
                    itemsPerPage,
                    blockNumber: block ? block.get().number : hashOrNumber
                });
                res.json(txs.map(tx => tx.get({ plain: true })));
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /block/{blockNumber}/tx-count-types:
     *   get:
     *     summary: Returns count of each transaction type in the blockNumber
     *     tags: [Block]
     *     parameters:
     *       - name: blockNumber
     *         description: filter by blockNumber
     *         in: path
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: count of each transaction type in the blockNumber
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Transaction'
     */
    router.get("/block/:blockNumber/tx-count-types", async (req, res, next) => {
        const blockNumber = parseInt(req.params.blockNumber, 10);
        try {
            const models = (await TransactionModel.getNumberOfEachTransactionType(
                {
                    blockNumber
                }
            )).map(
                model =>
                    (model.get() as unknown) as { type: string; count: string }
            );
            const counts =
                _.reduce(
                    models.map(item => ({
                        [item.type]: parseInt(item.count, 10)
                    })),
                    _.extend
                ) || {};
            res.json(counts);
        } catch (e) {
            next(e);
        }
    });

    /**
     * @swagger
     * /block:
     *   get:
     *     summary: Returns blocks
     *     tags: [Block]
     *     parameters:
     *       - name: address
     *         description: Author filter by address
     *         in: query
     *         required: false
     *         type: string
     *       - name: page
     *         description: page for the pagination (default 1)
     *         in: query
     *         required: false
     *         type: number
     *       - name: itemsPerPage
     *         description: items per page for the pagination (default 15)
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
     *         description: blocks
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Block'
     */
    router.get(
        "/block",
        validate({
            query: {
                ...blockSchema,
                ...paginationSchema
            }
        }),
        syncIfNeeded(context),
        async (req, res, next) => {
            const address = req.query.address;
            const page = req.query.page && parseInt(req.query.page, 10);
            const itemsPerPage =
                req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);

            try {
                const blockInsts = await BlockModel.getBlocks({
                    address,
                    page,
                    itemsPerPage
                });
                const blocks = blockInsts.map(blockInst =>
                    blockInst.get({ plain: true })
                );
                res.json(blocks);
            } catch (e) {
                next(e);
            }
        }
    );
}
