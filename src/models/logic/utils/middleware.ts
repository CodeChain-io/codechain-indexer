import { RequestHandler } from "express";
import { SERVICE_UNAVAILABLE } from "http-status-codes";
import { IndexerContext } from "../../../context";

export function syncIfNeeded(context: IndexerContext): RequestHandler {
    return async (req, res, next) => {
        if (req.query.sync === true) {
            try {
                await context.worker.sync();
            } catch (e) {
                const error = e as Error;
                if (error.message.search(/ECONNRESET|ECONNREFUSED/) >= 0) {
                    res.status(SERVICE_UNAVAILABLE).send();
                    return;
                }
                next(e);
            }
        }
        next();
    };
}
