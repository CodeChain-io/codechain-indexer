import { Router } from "express";
import { ServerContext } from "../ServerContext";

function handle(context: ServerContext, router: Router) {
    router.get("/accounts", async (_, res, next) => {
        try {
            const accounts = await context.db.getAccounts();
            res.send(accounts);
        } catch (e) {
            next(e);
        }
    });
}

export const AccountAction = {
    handle
};
