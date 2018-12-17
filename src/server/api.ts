import * as cors from "cors";
import * as express from "express";
import * as _ from "lodash";

import { ServerContext } from ".";

const corsOptions = {
    origin: true,
    credentials: true,
    exposedHeaders: ["Location", "Link"]
};

export function createApiRouter(context: ServerContext, useCors = false) {
    const router = express.Router();

    if (useCors) {
        router.options("*", cors(corsOptions)).use(cors(corsOptions));
    }

    return router;
}
