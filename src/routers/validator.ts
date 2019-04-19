import * as express from "express";
import * as Joi from "joi";

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
    "composeAsset",
    "decomposeAsset",
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

const ADDRESS_TYPES = [
    "TransactionSigner",
    "TransactionApprover",
    "AssetOwner",
    "Approver",
    "Registrar"
];

const REASON_TYPES = ["fee", "author", "stake", "tx", "initial_distribution"];

const LOG_FILTER = ["block", "tx", ...TYPES];

// FIXME:
export const platformAddressSchema = Joi.string();
// FIXME: PlatformAddress or AssetAddress
const address = Joi.string();
const addressFilter = Joi.string().regex(
    new RegExp(`^(${ADDRESS_TYPES.join("|")})(,(${ADDRESS_TYPES.join("|")}))*$`)
);
export const assetTypeSchema = Joi.string().regex(/^(0x)?[0-9a-f]{40}$/);
const tracker = Joi.string().regex(/^(0x)?[0-9a-f]{64}$/);
const type = Joi.string().regex(
    new RegExp(`^(${TYPES.join("|")})(,(${TYPES.join("|")}))*$`)
);
const reasonFilter = Joi.string().regex(
    new RegExp(`^(${REASON_TYPES.join("|")})(,(${REASON_TYPES.join("|")}))*$`)
);
const shardId = Joi.number();
const onlyConfirmed = Joi.boolean();
const onlySuccessful = Joi.boolean();
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

export const txSchema = {
    address,
    addressFilter,
    assetType: assetTypeSchema,
    tracker,
    type,
    includePending,
    onlySuccessful,
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
