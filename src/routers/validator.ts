import * as express from "express";
import * as Joi from "joi";
import { defaultAllReasons } from "../models/cccChanges";

const expressValidation = require("express-validation");

export const validate: (params: {
    query?: Joi.SchemaLike;
    params?: Joi.SchemaLike;
}) => express.RequestHandler = params => {
    return expressValidation({
        query: params.query && Joi.compile(params.query),
        params: params.params && Joi.compile(params.params),
        options: {
            allowUnknownQuery: false
        },
        ...params
    });
};

const TYPES = [
    "mintAsset",
    "transferAsset",
    "changeAssetScheme",
    "increaseAssetSupply",
    "wrapCCC",
    "unwrapCCC",
    "pay",
    "setRegularKey",
    "createShard",
    "setShardOwners",
    "setShardUsers",
    "store",
    "remove",
    "custom"
];

const LOG_FILTER = ["block", "tx", ...TYPES];

// FIXME:
export const platformAddressSchema = Joi.string();
// FIXME: PlatformAddress or AssetAddress
const address = Joi.string();
export const assetTypeSchema = Joi.string().regex(/^(0x)?[0-9a-f]{40}$/);
const type = Joi.string().regex(
    new RegExp(`^(${TYPES.join("|")})(,(${TYPES.join("|")}))*$`)
);
const reasonFilter = Joi.string().regex(
    new RegExp(
        `^(${defaultAllReasons.join("|")})(,(${defaultAllReasons.join("|")}))*$`
    )
);
const shardId = Joi.number();
const onlyConfirmed = Joi.boolean();
const sync = Joi.boolean();
const confirmThreshold = Joi.number()
    .min(0)
    .integer();
const includePending = Joi.boolean();

export const paginationSchema = {
    page: Joi.number()
        .positive()
        .integer(),
    itemsPerPage: Joi.number()
        .positive()
        .integer()
        .min(1)
        .max(100)
};

export const utxoPaginationSchema = {
    firstEvaluatedKey: Joi.array().items(
        Joi.number(),
        Joi.number(),
        Joi.number()
    ),
    lastEvaluatedKey: Joi.array().items(
        Joi.number(),
        Joi.number(),
        Joi.number()
    )
};

export const txSchema = {
    address,
    assetType: assetTypeSchema,
    type,
    includePending,
    onlyConfirmed,
    confirmThreshold,
    sync
};

export const pendingTxSchema = {
    address,
    assetType: assetTypeSchema,
    type,
    sync
};

export const blockSchema = {
    address,
    sync
};

export const syncSchema = {
    sync
};

export const reasonFilterSchema = {
    reasonFilter
};

const logFilter = Joi.string().regex(
    new RegExp(`^(${LOG_FILTER.join("|")})(,(${LOG_FILTER.join("|")}))*$`)
);
const logDate = Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const logCountSchema = {
    filter: logFilter.required(),
    date: logDate.required()
};

export const logMinersSchema = {
    date: logDate.required()
};

export const utxoSchema = {
    address,
    assetType: assetTypeSchema,
    shardId,
    onlyConfirmed,
    confirmThreshold,
    sync
};

export const snapshotSchema = {
    assetType: assetTypeSchema.required(),
    date: Joi.date().iso()
};
