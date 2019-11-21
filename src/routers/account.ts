import { Router } from "express";
import { IndexerContext } from "../context";
import * as AccountModel from "../models/logic/account";
import * as CCCChangeModel from "../models/logic/cccChange";
import { parseEvaluatedKey } from "../models/logic/utils/middleware";
import { createPaginationResult } from "./pagination";
import {
    accountBalanceHistoryPaginationSchema,
    paginationSchema,
    platformAddressSchema,
    reasonFilterSchema,
    validate
} from "./validator";

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: Account management
 */
export function handle(_C: IndexerContext, router: Router) {
    /**
     * @swagger
     * /account:
     *   get:
     *     summary: Returns all accounts
     *     tags: [Account]
     *     parameters:
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
     *               seq:
     *                 type: number
     *                 example: 1231
     */
    router.get(
        "/account",
        validate({ query: { ...paginationSchema } }),
        async (req, res, next) => {
            const page = req.query.page && parseInt(req.query.page, 10);
            const itemsPerPage =
                req.query.itemsPerPage && parseInt(req.query.itemsPerPage, 10);
            try {
                const accountInsts = await AccountModel.getAccounts({
                    page,
                    itemsPerPage
                });
                const accounts = accountInsts.map(inst =>
                    inst.get({ plain: true })
                );
                res.json(accounts);
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /account/{address}:
     *   get:
     *     summary: Returns account of the specific address
     *     tags: [Account]
     *     parameters:
     *       - name: address
     *         description: Account's address
     *         required: true
     *         in: path
     *         type: string
     *     responses:
     *       200:
     *         description: account
     *         schema:
     *           type: object
     *           properties:
     *             balance:
     *               type: string
     *               example: "9999999999"
     *             seq:
     *               type: number
     *               example: 1231
     */
    router.get(
        "/account/:address",
        validate({ params: { address: platformAddressSchema } }),
        async (req, res, next) => {
            const address = req.params.address;
            try {
                const accountInst = await AccountModel.getByAddress(address);
                res.json(accountInst ? accountInst.get({ plain: true }) : null);
            } catch (e) {
                next(e);
            }
        }
    );

    /**
     * @swagger
     * /account/{address}/balance-history:
     *   get:
     *     summary: Returns account of the specific address
     *     tags: [Account]
     *     parameters:
     *       - name: address
     *         description: Account's address
     *         required: true
     *         in: path
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
     *     responses:
     *       200:
     *         description: account
     *         schema:
     *           type: object
     *           properties:
     *             address:
     *               type: string
     *               example: "tccq9zwe3yyg6zq0jxdr68ssrh99l2vnfxu0gwlgse8"
     *             change:
     *               type: string
     *               example: "-100"
     *             blockNumber:
     *               type: number
     *               example: 1231
     *             reason:
     *               type: number
     *               example: "tx"
     *             transactionHash:
     *               type: string
     *               example: "2894e93a7b7bff4638dbe08d87d48a74115be2a406169afb729264b8e2cb5ec5"
     */
    router.get(
        "/account/:address/balance-history",
        parseEvaluatedKey,
        validate({
            params: { address: platformAddressSchema },
            query: {
                ...reasonFilterSchema,
                ...paginationSchema,
                ...accountBalanceHistoryPaginationSchema
            }
        }),
        async (req, res, next) => {
            const reasonFilter = req.query.reasonFilter;
            const address = req.params.address;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const itemsPerPage = req.query.itemsPerPage
                ? parseInt(req.query.itemsPerPage, 10)
                : 15;

            const lastEvaluatedKey = req.query.lastEvaluatedKey;
            const firstEvaluatedKey = req.query.firstEvaluatedKey;

            try {
                const accounts = await CCCChangeModel.getByAddress(address, {
                    page,
                    itemsPerPage: itemsPerPage + 1,
                    reasonFilter:
                        typeof reasonFilter === "string"
                            ? reasonFilter.split(",")
                            : undefined,
                    firstEvaluatedKey,
                    lastEvaluatedKey
                });

                res.json(
                    createPaginationResult({
                        query: {
                            firstEvaluatedKey,
                            lastEvaluatedKey
                        },
                        rows: accounts.map(account =>
                            account.get({ plain: true })
                        ),
                        getEvaluatedKey:
                            CCCChangeModel.createCCCChangesEvaluatedKey,
                        itemsPerPage
                    })
                );
                res.json();
            } catch (e) {
                next(e);
            }
        }
    );
}
