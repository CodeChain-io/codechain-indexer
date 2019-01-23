import { Router } from "express";
import { IndexerContext } from "../context";
import * as AccountModel from "../models/logic/account";

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
    router.get("/account", async (req, res, next) => {
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
    });

    /**
     * @swagger
     * /account/count:
     *   get:
     *     summary: Returns total counts of the accounts
     *     tags: [Account]
     *     responses:
     *       200:
     *         description: account
     *         schema:
     *           type: number
     *           example: 12
     */
    router.get("/account/count", async (_, res, next) => {
        try {
            const count = await AccountModel.getCountOfAccounts();
            res.json(count);
        } catch (e) {
            next(e);
        }
    });
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
    router.get("/account/:address", async (req, res, next) => {
        const address = req.params.address;
        try {
            const accountInst = await AccountModel.getByAddress(address);
            res.json(accountInst ? accountInst.get({ plain: true }) : null);
        } catch (e) {
            next(e);
        }
    });
}
