import * as cors from "cors";
import * as express from "express";
import * as _ from "lodash";
import * as BlockHandler from "./routers/block";
import * as StatusHandler from "./routers/status";

import { IndexerContext } from "./context";

const corsOptions = {
    origin: true,
    credentials: true,
    exposedHeaders: ["Location", "Link"]
};

export function createApiRouter(context: IndexerContext, useCors = false) {
    const router = express.Router();

    if (useCors) {
        router.options("*", cors(corsOptions)).use(cors(corsOptions));
    }

    StatusHandler.handle(context, router);
    BlockHandler.handle(context, router);

    return router;
}
