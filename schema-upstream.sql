SET statement_timeout = 0;

SET lock_timeout = 0;

SET idle_in_transaction_session_timeout = 0;

SET client_encoding = 'UTF8';

SET standard_conforming_strings = ON;

SELECT
    pg_catalog.set_config('search_path', '', FALSE);

SET check_function_bodies = FALSE;

SET xmloption = content;

SET client_min_messages = warning;

SET row_security = OFF;

CREATE TYPE public. "enum_CCCChanges_reason" AS ENUM (
    'fee',
    'author',
    'stake',
    'tx',
    'initial_distribution',
    'deposit',
    'validator',
    'report'
);

ALTER TYPE public. "enum_CCCChanges_reason" OWNER TO "user";

SET default_tablespace = '';

SET default_with_oids = FALSE;

CREATE TABLE public. "Accounts" (
    address character varying(255) NOT NULL,
    balance numeric(20, 0) NOT NULL,
    seq integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "Accounts" OWNER TO "user";

CREATE TABLE public. "AddressLogs" (
    id bigint NOT NULL,
    "transactionHash" character varying(255) NOT NULL,
    "transactionType" character varying(255) NOT NULL,
    "transactionTracker" character varying(255),
    "blockNumber" integer,
    "transactionIndex" integer,
    success boolean,
    "isPending" boolean NOT NULL,
    address character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "AddressLogs" OWNER TO "user";

CREATE SEQUENCE public.
    "AddressLogs_id_seq" START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public. "AddressLogs_id_seq" OWNER TO "user";

ALTER SEQUENCE public.
    "AddressLogs_id_seq" OWNED BY public. "AddressLogs".id;

CREATE TABLE public. "AssetImages" (
    "transactionHash" character varying(255) NOT NULL,
    "assetType" character varying(255) NOT NULL,
    image bytea NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "AssetImages" OWNER TO "user";

CREATE TABLE public. "AssetSchemes" (
    "transactionHash" character varying(255) NOT NULL,
    "assetType" character varying(255) NOT NULL,
    "shardId" integer NOT NULL,
    metadata text NOT NULL,
    approver character varying(255),
    registrar character varying(255),
    "allowedScriptHashes" jsonb NOT NULL,
    supply numeric(20, 0),
    "networkId" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    seq integer DEFAULT 0
);

ALTER TABLE public. "AssetSchemes" OWNER TO "user";

CREATE TABLE public. "AssetTransferOutputs" (
    id bigint NOT NULL,
    "transactionHash" character varying(255) NOT NULL,
    "transactionTracker" character varying(255) NOT NULL,
    "lockScriptHash" character varying(255) NOT NULL,
    parameters jsonb NOT NULL,
    "assetType" character varying(255) NOT NULL,
    "shardId" integer NOT NULL,
    quantity numeric(20, 0) NOT NULL,
    index integer NOT NULL,
    owner character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "AssetTransferOutputs" OWNER TO "user";

CREATE SEQUENCE public.
    "AssetTransferOutputs_id_seq" START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public. "AssetTransferOutputs_id_seq" OWNER TO "user";

ALTER SEQUENCE public.
    "AssetTransferOutputs_id_seq" OWNED BY public. "AssetTransferOutputs".id;

CREATE TABLE public. "AssetTypeLogs" (
    id bigint NOT NULL,
    "transactionHash" character varying(255) NOT NULL,
    "transactionType" character varying(255) NOT NULL,
    "transactionTracker" character varying(255),
    "blockNumber" integer,
    "transactionIndex" integer,
    "isPending" boolean NOT NULL,
    "assetType" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "AssetTypeLogs" OWNER TO "user";

CREATE SEQUENCE public.
    "AssetTypeLogs_id_seq" START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public. "AssetTypeLogs_id_seq" OWNER TO "user";

ALTER SEQUENCE public.
    "AssetTypeLogs_id_seq" OWNED BY public. "AssetTypeLogs".id;

CREATE TABLE public. "Blocks" (
    hash character varying(255) NOT NULL,
    "parentHash" character varying(255) NOT NULL,
    "timestamp" integer NOT NULL,
    number integer NOT NULL,
    author character varying(255) NOT NULL,
    "extraData" jsonb NOT NULL,
    "transactionsRoot" character varying(255) NOT NULL,
    "stateRoot" character varying(255) NOT NULL,
    score character varying(255) NOT NULL,
    seal jsonb NOT NULL,
    "miningReward" numeric(20, 0) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "transactionsCount" integer,
    size integer,
    "transactionsCountByType" jsonb,
    "missedSignersOfPrev" text[] DEFAULT ARRAY[] ::text[],
    "intermediateRewards" numeric(20, 0) DEFAULT '0' ::numeric
);

ALTER TABLE public. "Blocks" OWNER TO "user";

CREATE TABLE public. "CCCChanges" (
    id bigint NOT NULL,
    address character varying(255) NOT NULL,
    change numeric(20, 0) NOT NULL,
    "blockNumber" integer NOT NULL,
    reason public. "enum_CCCChanges_reason" NOT NULL,
    "transactionHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT ccc_changes_block_number_constraint CHECK ((((reason = 'initial_distribution'::public. "enum_CCCChanges_reason")
                AND ("blockNumber" = 0))
	    OR ((reason = ANY (ARRAY['author'::public. "enum_CCCChanges_reason", 'stake'::public.
		"enum_CCCChanges_reason", 'fee'::public. "enum_CCCChanges_reason", 'tx'::public.
		"enum_CCCChanges_reason", 'deposit'::public. "enum_CCCChanges_reason", 'validator'::public.
		"enum_CCCChanges_reason", 'report'::public. "enum_CCCChanges_reason"]))
                AND ("blockNumber" > 0)))),
    CONSTRAINT ccc_changes_change_constraint CHECK ((((reason = 'fee'::public. "enum_CCCChanges_reason")
                AND (change < (0)::numeric))
	    OR ((reason = ANY (ARRAY['author'::public. "enum_CCCChanges_reason", 'stake'::public.
		"enum_CCCChanges_reason", 'initial_distribution'::public. "enum_CCCChanges_reason",
		'validator'::public. "enum_CCCChanges_reason", 'report'::public. "enum_CCCChanges_reason"]))
                AND (change > (0)::numeric))
            OR (reason = ANY (ARRAY['tx'::public. "enum_CCCChanges_reason", 'deposit'::public. "enum_CCCChanges_reason"])))),
    CONSTRAINT ccc_changes_transaction_hash_constraint CHECK ((((reason = ANY (ARRAY['author'::public.
	"enum_CCCChanges_reason", 'stake'::public. "enum_CCCChanges_reason", 'initial_distribution'::public.
	"enum_CCCChanges_reason", 'deposit'::public. "enum_CCCChanges_reason", 'validator'::public.
	"enum_CCCChanges_reason"]))
                AND ("transactionHash" IS NULL))
	    OR ((reason = ANY (ARRAY['fee'::public. "enum_CCCChanges_reason", 'tx'::public. "enum_CCCChanges_reason",
		'deposit'::public. "enum_CCCChanges_reason", 'report'::public. "enum_CCCChanges_reason"]))
                AND ("transactionHash" IS NOT NULL))))
);

ALTER TABLE public. "CCCChanges" OWNER TO "user";

CREATE SEQUENCE public.
    "CCCChanges_id_seq" START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public. "CCCChanges_id_seq" OWNER TO "user";

ALTER SEQUENCE public.
    "CCCChanges_id_seq" OWNED BY public. "CCCChanges".id;

CREATE TABLE public. "ChangeAssetSchemes" (
    "transactionHash" character varying(255) NOT NULL,
    "assetType" character varying(255) NOT NULL,
    "networkId" character varying(255) NOT NULL,
    "shardId" integer NOT NULL,
    metadata text NOT NULL,
    approver character varying(255),
    registrar character varying(255),
    "allowedScriptHashes" jsonb NOT NULL,
    approvals jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    seq integer DEFAULT 0
);

ALTER TABLE public. "ChangeAssetSchemes" OWNER TO "user";

CREATE TABLE public. "CreateShards" (
    "transactionHash" character varying(255) NOT NULL,
    "shardId" integer,
    users jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "CreateShards" OWNER TO "user";

CREATE TABLE public. "Customs" (
    "transactionHash" character varying(255) NOT NULL,
    "handlerId" integer NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "Customs" OWNER TO "user";

CREATE TABLE public. "IncreaseAssetSupplies" (
    "transactionHash" character varying(255) NOT NULL,
    "assetType" character varying(255) NOT NULL,
    "networkId" character varying(255) NOT NULL,
    "shardId" integer NOT NULL,
    approvals jsonb NOT NULL,
    "lockScriptHash" character varying(255) NOT NULL,
    parameters jsonb NOT NULL,
    supply numeric(20, 0) NOT NULL,
    recipient character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    seq integer DEFAULT 0
);

ALTER TABLE public. "IncreaseAssetSupplies" OWNER TO "user";

CREATE TABLE public. "Logs" (
    id character varying(255) NOT NULL,
    date character varying(255) NOT NULL,
    count integer NOT NULL,
    type character varying(255) NOT NULL,
    value character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "Logs" OWNER TO "user";

CREATE TABLE public. "MintAssets" (
    "transactionHash" character varying(255) NOT NULL,
    "networkId" character varying(255) NOT NULL,
    "shardId" integer NOT NULL,
    metadata text NOT NULL,
    approver character varying(255),
    registrar character varying(255),
    "allowedScriptHashes" jsonb NOT NULL,
    approvals jsonb NOT NULL,
    "lockScriptHash" character varying(255) NOT NULL,
    parameters jsonb NOT NULL,
    supply numeric(20, 0) NOT NULL,
    "assetName" character varying(255),
    recipient character varying(255) NOT NULL,
    "assetType" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "MintAssets" OWNER TO "user";

CREATE TABLE public. "Pays" (
    "transactionHash" character varying(255) NOT NULL,
    receiver character varying(255) NOT NULL,
    quantity numeric(20, 0) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "Pays" OWNER TO "user";

CREATE TABLE public. "Removes" (
    "transactionHash" character varying(255) NOT NULL,
    "textHash" character varying(255) NOT NULL,
    signature character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "Removes" OWNER TO "user";

CREATE TABLE public. "SequelizeMeta" (
    name character varying(255) NOT NULL
);

ALTER TABLE public. "SequelizeMeta" OWNER TO "user";

CREATE TABLE public. "SetRegularKeys" (
    "transactionHash" character varying(255) NOT NULL,
    key character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "SetRegularKeys" OWNER TO "user";

CREATE TABLE public. "SetShardOwners" (
    "transactionHash" character varying(255) NOT NULL,
    "shardId" integer NOT NULL,
    owners jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "SetShardOwners" OWNER TO "user";

CREATE TABLE public. "SetShardUsers" (
    "transactionHash" character varying(255) NOT NULL,
    "shardId" integer NOT NULL,
    users jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "SetShardUsers" OWNER TO "user";

CREATE TABLE public. "Stores" (
    "transactionHash" character varying(255) NOT NULL,
    content character varying(255) NOT NULL,
    certifier character varying(255) NOT NULL,
    signature character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "Stores" OWNER TO "user";

CREATE TABLE public. "Transactions" (
    hash character varying(255) NOT NULL,
    "blockNumber" integer,
    "blockHash" character varying(255),
    tracker character varying(255),
    "transactionIndex" integer,
    type character varying(255) NOT NULL,
    seq numeric(20, 0) NOT NULL,
    fee character varying(255) NOT NULL,
    "networkId" character varying(255) NOT NULL,
    sig character varying(255) NOT NULL,
    signer character varying(255) NOT NULL,
    "errorHint" text,
    "timestamp" integer,
    "isPending" boolean NOT NULL,
    "pendingTimestamp" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "Transactions" OWNER TO "user";

CREATE TABLE public. "TransferAssets" (
    "transactionHash" character varying(255) NOT NULL,
    "networkId" character varying(255) NOT NULL,
    metadata character varying(255) NOT NULL,
    approvals jsonb NOT NULL,
    expiration numeric(20, 0),
    inputs jsonb NOT NULL,
    burns jsonb NOT NULL,
    outputs jsonb NOT NULL,
    orders jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "TransferAssets" OWNER TO "user";

CREATE TABLE public. "UTXOs" (
    id bigint NOT NULL,
    address character varying(255) NOT NULL,
    "assetType" character varying(255) NOT NULL,
    "shardId" integer NOT NULL,
    "lockScriptHash" character varying(255) NOT NULL,
    parameters jsonb NOT NULL,
    quantity numeric(20, 0) NOT NULL,
    "orderHash" character varying(255),
    "transactionHash" character varying(255) NOT NULL,
    "transactionTracker" character varying(255) NOT NULL,
    "transactionOutputIndex" integer NOT NULL,
    "usedTransactionHash" character varying(255),
    "blockNumber" integer NOT NULL,
    "usedBlockNumber" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "UTXOs" OWNER TO "user";

CREATE SEQUENCE public.
    "UTXOs_id_seq" START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public. "UTXOs_id_seq" OWNER TO "user";

ALTER SEQUENCE public.
    "UTXOs_id_seq" OWNED BY public. "UTXOs".id;

CREATE TABLE public. "UnwrapCCCs" (
    "transactionHash" character varying(255) NOT NULL,
    receiver character varying(255) NOT NULL,
    burn jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "UnwrapCCCs" OWNER TO "user";

CREATE TABLE public. "WrapCCCs" (
    "transactionHash" character varying(255) NOT NULL,
    "shardId" integer NOT NULL,
    "lockScriptHash" character varying(255) NOT NULL,
    parameters jsonb NOT NULL,
    quantity numeric(20, 0) NOT NULL,
    recipient character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public. "WrapCCCs" OWNER TO "user";

ALTER TABLE ONLY public. "AddressLogs"
    ALTER COLUMN id SET DEFAULT nextval('public."AddressLogs_id_seq"'::regclass);

ALTER TABLE ONLY public. "AssetTransferOutputs"
    ALTER COLUMN id SET DEFAULT nextval('public."AssetTransferOutputs_id_seq"'::regclass);

ALTER TABLE ONLY public. "AssetTypeLogs"
    ALTER COLUMN id SET DEFAULT nextval('public."AssetTypeLogs_id_seq"'::regclass);

ALTER TABLE ONLY public. "CCCChanges"
    ALTER COLUMN id SET DEFAULT nextval('public."CCCChanges_id_seq"'::regclass);

ALTER TABLE ONLY public. "UTXOs"
    ALTER COLUMN id SET DEFAULT nextval('public."UTXOs_id_seq"'::regclass);

ALTER TABLE ONLY public. "Accounts"
    ADD CONSTRAINT "Accounts_pkey" PRIMARY KEY (address);

ALTER TABLE ONLY public. "AddressLogs"
    ADD CONSTRAINT "AddressLogs_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public. "AssetImages"
    ADD CONSTRAINT "AssetImages_pkey" PRIMARY KEY ("assetType");

ALTER TABLE ONLY public. "AssetSchemes"
    ADD CONSTRAINT "AssetSchemes_pkey" PRIMARY KEY ("assetType");

ALTER TABLE ONLY public. "AssetTransferOutputs"
    ADD CONSTRAINT "AssetTransferOutputs_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public. "AssetTypeLogs"
    ADD CONSTRAINT "AssetTypeLogs_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public. "Blocks"
    ADD CONSTRAINT "Blocks_pkey" PRIMARY KEY (HASH);

ALTER TABLE ONLY public. "CCCChanges"
    ADD CONSTRAINT "CCCChanges_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public. "ChangeAssetSchemes"
    ADD CONSTRAINT "ChangeAssetSchemes_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "CreateShards"
    ADD CONSTRAINT "CreateShards_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "Customs"
    ADD CONSTRAINT "Customs_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "IncreaseAssetSupplies"
    ADD CONSTRAINT "IncreaseAssetSupplies_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public. "MintAssets"
    ADD CONSTRAINT "MintAssets_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "Pays"
    ADD CONSTRAINT "Pays_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "Removes"
    ADD CONSTRAINT "Removes_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);

ALTER TABLE ONLY public. "SetRegularKeys"
    ADD CONSTRAINT "SetRegularKeys_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "SetShardOwners"
    ADD CONSTRAINT "SetShardOwners_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "SetShardUsers"
    ADD CONSTRAINT "SetShardUsers_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "Stores"
    ADD CONSTRAINT "Stores_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "Transactions"
    ADD CONSTRAINT "Transactions_pkey" PRIMARY KEY (HASH);

ALTER TABLE ONLY public. "TransferAssets"
    ADD CONSTRAINT "TransferAssets_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "UTXOs"
    ADD CONSTRAINT "UTXOs_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public. "UnwrapCCCs"
    ADD CONSTRAINT "UnwrapCCCs_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "WrapCCCs"
    ADD CONSTRAINT "WrapCCCs_pkey" PRIMARY KEY ("transactionHash");

ALTER TABLE ONLY public. "Blocks"
    ADD CONSTRAINT blocks_number_idx UNIQUE (number);

CREATE INDEX "UTXOs_assetType_usedBlockNumber" ON public. "UTXOs"
USING btree ("assetType", "usedBlockNumber");

CREATE INDEX address_logs_address ON public. "AddressLogs"
USING btree (address);

CREATE INDEX address_logs_block_number ON public. "AddressLogs"
USING btree ("blockNumber");

CREATE INDEX address_logs_transaction_hash ON public. "AddressLogs"
USING HASH ("transactionHash");

CREATE INDEX asset_schemes_transaction_hash ON public. "AssetSchemes"
USING HASH ("transactionHash");

CREATE INDEX asset_transfer_outputs_transaction_hash ON public. "AssetTransferOutputs"
USING HASH ("transactionHash");

CREATE INDEX asset_transfer_outputs_transaction_tracker_index ON public. "AssetTransferOutputs"
USING btree ("transactionTracker", INDEX);

CREATE INDEX asset_type_logs_asset_type ON public. "AssetTypeLogs"
USING btree ("assetType");

CREATE INDEX asset_type_logs_transaction_hash ON public. "AssetTypeLogs"
USING HASH ("transactionHash");

CREATE INDEX blocks_timestamp_idx ON public. "Blocks"
USING btree ("timestamp");

CREATE UNIQUE INDEX ccc_changes_address_block_number_id ON public. "CCCChanges"
USING btree (address, "blockNumber", id);

CREATE INDEX ccc_changes_block_number ON public. "CCCChanges"
USING btree ("blockNumber");

CREATE INDEX ccc_changes_transaction_hash ON public. "CCCChanges"
USING btree ("transactionHash");

CREATE UNIQUE INDEX ccc_changes_unique_index ON public. "CCCChanges"
USING btree (address, "blockNumber", reason, "transactionHash");

CREATE UNIQUE INDEX ccc_changes_unique_index2 ON public. "CCCChanges"
USING btree (address, "blockNumber", reason)
WHERE (reason = ANY (ARRAY['author'::public. "enum_CCCChanges_reason", 'stake'::public. "enum_CCCChanges_reason",
    'initial_distribution'::public. "enum_CCCChanges_reason", 'validator'::public. "enum_CCCChanges_reason"]));

CREATE INDEX set_regular_keys_key ON public. "SetRegularKeys"
USING btree (KEY);

CREATE INDEX transactions_block_hash ON public. "Transactions"
USING btree ("blockHash");

CREATE INDEX transactions_block_number_transaction_index ON public. "Transactions"
USING btree ("blockNumber", "transactionIndex");

CREATE INDEX transactions_is_pending ON public. "Transactions"
USING btree ("isPending");

CREATE INDEX transactions_tracker ON public. "Transactions"
USING btree (tracker);

CREATE INDEX u_t_x_os_transaction_hash ON public. "UTXOs"
USING HASH ("transactionHash");

CREATE INDEX u_t_x_os_used_transaction_hash ON public. "UTXOs"
USING HASH ("usedTransactionHash");

ALTER TABLE ONLY public. "AddressLogs"
    ADD CONSTRAINT "AddressLogs_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions"
	(HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "AssetImages"
    ADD CONSTRAINT "AssetImages_assetType_fkey" FOREIGN KEY ("assetType") REFERENCES public. "AssetSchemes"
	("assetType") ON DELETE CASCADE;

ALTER TABLE ONLY public. "AssetSchemes"
    ADD CONSTRAINT "AssetSchemes_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "AssetTransferOutputs"
    ADD CONSTRAINT "AssetTransferOutputs_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "AssetTypeLogs"
    ADD CONSTRAINT "AssetTypeLogs_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "CCCChanges"
    ADD CONSTRAINT "CCCChanges_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES public. "Blocks" (number) ON DELETE CASCADE;

ALTER TABLE ONLY public. "CCCChanges"
    ADD CONSTRAINT "CCCChanges_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions"
	(HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "ChangeAssetSchemes"
    ADD CONSTRAINT "ChangeAssetSchemes_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "CreateShards"
    ADD CONSTRAINT "CreateShards_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "Customs"
    ADD CONSTRAINT "Customs_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions"
	(HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "IncreaseAssetSupplies"
    ADD CONSTRAINT "IncreaseAssetSupplies_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "MintAssets"
    ADD CONSTRAINT "MintAssets_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions"
	(HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "Pays"
    ADD CONSTRAINT "Pays_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions" (HASH)
	ON DELETE CASCADE;

ALTER TABLE ONLY public. "Removes"
    ADD CONSTRAINT "Removes_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions"
	(HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "SetRegularKeys"
    ADD CONSTRAINT "SetRegularKeys_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "SetShardOwners"
    ADD CONSTRAINT "SetShardOwners_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "SetShardUsers"
    ADD CONSTRAINT "SetShardUsers_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "Stores"
    ADD CONSTRAINT "Stores_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions"
	(HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "Transactions"
    ADD CONSTRAINT "Transactions_blockHash_fkey" FOREIGN KEY ("blockHash") REFERENCES public. "Blocks" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "TransferAssets"
    ADD CONSTRAINT "TransferAssets_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "UTXOs"
    ADD CONSTRAINT "UTXOs_assetType_fkey" FOREIGN KEY ("assetType") REFERENCES public. "AssetSchemes" ("assetType") ON DELETE CASCADE;

ALTER TABLE ONLY public. "UTXOs"
    ADD CONSTRAINT "UTXOs_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions"
	(HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "UTXOs"
    ADD CONSTRAINT "UTXOs_usedTransactionHash_fkey" FOREIGN KEY ("usedTransactionHash") REFERENCES public.
	"Transactions" (HASH) ON DELETE SET NULL;

ALTER TABLE ONLY public. "UnwrapCCCs"
    ADD CONSTRAINT "UnwrapCCCs_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions"
	(HASH) ON DELETE CASCADE;

ALTER TABLE ONLY public. "WrapCCCs"
    ADD CONSTRAINT "WrapCCCs_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES public. "Transactions"
	(HASH) ON DELETE CASCADE;
