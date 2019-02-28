import { SDK } from "codechain-sdk";
import {
    ChangeAssetScheme,
    ComposeAsset,
    DecomposeAsset,
    H160,
    H256,
    MintAsset,
    SignedTransaction,
    TransferAsset,
    U64,
    UnwrapCCC,
    WrapCCC
} from "codechain-sdk/lib/core/classes";
import { AssetTransaction } from "codechain-sdk/lib/core/Transaction";
import { ComposeAssetActionJSON } from "codechain-sdk/lib/core/transaction/ComposeAsset";
import { CreateShardActionJSON } from "codechain-sdk/lib/core/transaction/CreateShard";
import { CustomActionJSON } from "codechain-sdk/lib/core/transaction/Custom";
import { DecomposeAssetActionJSON } from "codechain-sdk/lib/core/transaction/DecomposeAsset";
import { IncreaseAssetSupply } from "codechain-sdk/lib/core/transaction/IncreaseAssetSupply";
import { MintAssetActionJSON } from "codechain-sdk/lib/core/transaction/MintAsset";
import { PayActionJSON } from "codechain-sdk/lib/core/transaction/Pay";
import { RemoveActionJSON } from "codechain-sdk/lib/core/transaction/Remove";
import { SetRegularKeyActionJSON } from "codechain-sdk/lib/core/transaction/SetRegularKey";
import { SetShardOwnersActionJSON } from "codechain-sdk/lib/core/transaction/SetShardOwners";
import { SetShardUsersActionJSON } from "codechain-sdk/lib/core/transaction/SetShardUsers";
import { StoreActionJSON } from "codechain-sdk/lib/core/transaction/Store";
import { TransferAssetActionJSON } from "codechain-sdk/lib/core/transaction/TransferAsset";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { AssetTransferOutputAttribute } from "../assettransferoutput";
import models from "../index";
import { TransactionInstance } from "../transaction";
import { updateAssetScheme } from "./assetscheme";
import * as BlockModel from "./block";
import { createChangeAssetScheme } from "./changeAssetScheme";
import { createComposeAsset } from "./composeAsset";
import { createCreateShard } from "./createShard";
import { createCustom } from "./custom";
import { createDecomposeAsset } from "./decomposeAsset";
import { createIncreaseAssetSupply } from "./increaseassetsupply";
import { createMintAsset } from "./mintAsset";
import { createPay } from "./pay";
import { createRemove } from "./remove";
import { createSetRegularKey } from "./setRegularKey";
import { createSetShardOwners } from "./setShardOwners";
import { createSetShardUsers } from "./setShardUsers";
import { createStore } from "./store";
import { createTransferAsset } from "./transferAsset";
import { createUnwrapCCC } from "./unwrapCCC";
import { getOwner } from "./utils/address";
import { strip0xPrefix } from "./utils/format";
import { createUTXO, getByTxHashIndex, setUsed } from "./utxo";
import { createWrapCCC } from "./wrapCCC";

export async function createTransaction(
    tx: SignedTransaction,
    sdk: SDK,
    isPending: boolean,
    params?: {
        timestamp?: number | null;
        success?: boolean | null;
        errorHint?: string;
    } | null
): Promise<TransactionInstance> {
    const { timestamp = null, success = null } = params || {};
    const errorHint = params ? params.errorHint : undefined;
    try {
        const type = tx.unsigned.type();
        const hash = tx.hash().value;
        // FIXME: Add a method to SDK
        const isAssetTransaction =
            type === "mintAsset" ||
            type === "transferAsset" ||
            type === "composeAsset" ||
            type === "decomposeAsset" ||
            type === "increaseAssetSupply" ||
            type === "wrapCCC" ||
            type === "unwrapCCC";
        const tracker = isAssetTransaction
            ? ((tx.unsigned as any) as AssetTransaction).tracker().value
            : null;
        const txInstance = await models.Transaction.create({
            hash: strip0xPrefix(hash),
            type,
            blockNumber: tx.blockNumber,
            blockHash: tx.blockHash && strip0xPrefix(tx.blockHash.value),
            tracker: tracker && strip0xPrefix(tracker),
            transactionIndex: tx.transactionIndex,
            seq: tx.unsigned.seq()!,
            fee: tx.unsigned.fee()!.toString(10)!,
            networkId: tx.unsigned.networkId(),
            sig: strip0xPrefix(tx.toJSON().sig),
            signer: tx.getSignerAddress({
                networkId: tx.unsigned.networkId()
            }).value,
            success,
            errorHint: errorHint && strip0xPrefix(errorHint),
            timestamp,
            isPending,
            pendingTimestamp: isPending ? +new Date() / 1000 : null
        });
        switch (type) {
            case "mintAsset": {
                const mintAsset = tx.unsigned as MintAsset;
                await createMintAsset(
                    hash,
                    mintAsset.getMintedAsset(),
                    mintAsset.getAssetScheme(),
                    tx.toJSON().action as MintAssetActionJSON
                );
                break;
            }
            case "transferAsset": {
                const transferAsset = tx.unsigned as TransferAsset;
                await createTransferAsset(hash, transferAsset, tx.toJSON()
                    .action as TransferAssetActionJSON);
                break;
            }
            case "composeAsset": {
                const composeAsset = tx.unsigned as ComposeAsset;
                await createComposeAsset(hash, composeAsset, tx.toJSON()
                    .action as ComposeAssetActionJSON);
                break;
            }
            case "decomposeAsset": {
                const decomposeAsset = tx.unsigned as DecomposeAsset;
                await createDecomposeAsset(hash, decomposeAsset, tx.toJSON()
                    .action as DecomposeAssetActionJSON);
                break;
            }
            case "wrapCCC": {
                const wrap = tx.unsigned as WrapCCC;
                // FIXME: any
                await createWrapCCC(hash, wrap.toJSON().action as any);
                break;
            }
            case "unwrapCCC": {
                const unwrap = tx.unsigned as UnwrapCCC;
                await createUnwrapCCC(hash, unwrap, tx.unsigned.networkId());
                break;
            }
            case "changeAssetScheme": {
                const changeAssetScheme = tx.unsigned as ChangeAssetScheme;
                await createChangeAssetScheme(hash, changeAssetScheme);
                break;
            }
            case "increaseAssetSupply": {
                const increaseAssetSupply = tx.unsigned as IncreaseAssetSupply;
                await createIncreaseAssetSupply(hash, increaseAssetSupply);
                break;
            }
            case "pay": {
                const { quantity, receiver } = tx.toJSON()
                    .action as PayActionJSON;
                await createPay(hash, new U64(quantity).toString(10), receiver);
                break;
            }
            case "setRegularKey": {
                const { key } = tx.toJSON().action as SetRegularKeyActionJSON;
                await createSetRegularKey(hash, key);
                break;
            }
            case "createShard": {
                const { users } = tx.toJSON().action as CreateShardActionJSON;
                await createCreateShard(hash, users);
                break;
            }
            case "setShardOwners": {
                const { shardId, owners } = tx.toJSON()
                    .action as SetShardOwnersActionJSON;
                await createSetShardOwners(hash, shardId, owners);
                break;
            }
            case "setShardUsers": {
                const { shardId, users } = tx.toJSON()
                    .action as SetShardUsersActionJSON;
                await createSetShardUsers(hash, shardId, users);
                break;
            }
            case "store": {
                const { content, certifier, signature } = tx.toJSON()
                    .action as StoreActionJSON;
                await createStore(hash, content, certifier, signature);
                break;
            }
            case "remove": {
                const action = tx.toJSON().action as RemoveActionJSON;
                await createRemove(hash, action.hash, action.signature);
                break;
            }
            case "custom": {
                const { handlerId, buffer } = tx.toJSON()
                    .action as CustomActionJSON;
                await createCustom(
                    hash,
                    parseInt(handlerId, 10),
                    Buffer.from(buffer).toString("hex")
                );
                break;
            }
            default:
                throw new Error(`${type} is not an expected transaction type`);
        }

        if (!isPending && isAssetTransaction && success === true) {
            const txInst = await getByHash(tx.hash());
            if (!txInst) {
                throw Exception.InvalidTransaction();
            }
            await handleUTXO(txInst, tx.blockNumber!);
        }
        if (type === "createShard" && success === true) {
            await updateCreateShard(txInstance, sdk);
        }
        if (type === "changeAssetScheme" && success === true) {
            const txInst = await getByHash(tx.hash());
            if (!txInst) {
                throw Exception.InvalidTransaction();
            }
            await updateAssetScheme(txInst);
        }
        if (type === "increaseAssetSupply" && success === true) {
            const txInst = await getByHash(tx.hash());
            if (!txInst) {
                throw Exception.InvalidTransaction();
            }
            await updateAssetScheme(txInst);
        }
        return txInstance;
    } catch (err) {
        if (err instanceof Sequelize.UniqueConstraintError) {
            const duplicateFields = (err as any).fields;
            if (_.has(duplicateFields, "hash")) {
                throw Exception.AlreadyExist();
            }
        }
        if (err.message === "InvalidTransaction") {
            throw err;
        }
        console.error(err);
        throw Exception.DBError();
    }
}

export async function updatePendingTransaction(
    hash: H256,
    sdk: SDK,
    params: {
        success?: boolean | null;
        errorHint?: string;
        timestamp: number;
        transactionIndex: number;
        blockNumber: number;
        blockHash: H256;
    }
) {
    try {
        await models.Transaction.update(
            {
                blockHash: strip0xPrefix(params.blockHash.value),
                transactionIndex: params.transactionIndex,
                blockNumber: params.blockNumber,
                success: params.success,
                errorHint: params.errorHint && strip0xPrefix(params.errorHint),
                timestamp: params.timestamp,
                isPending: false
            },
            {
                where: {
                    hash: hash.value
                }
            }
        );
        const txInst = await getByHash(hash);
        const { type, success } = txInst!.get();
        if (txInst!.get().tracker != null && success === true) {
            await handleUTXO(txInst!, params.blockNumber);
        }
        if (
            txInst!.get().type === "createShard" &&
            txInst!.get().success === true
        ) {
            await updateCreateShard(txInst!, sdk);
        }
        if (type === "changeAssetScheme" && success === true) {
            await updateAssetScheme(txInst!);
        }
        if (type === "increaseAssetSupply" && success === true) {
            await updateAssetScheme(txInst!);
        }
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

async function updateCreateShard(tx: TransactionInstance, sdk: SDK) {
    const { hash } = tx.get();
    const shardId = await sdk.rpc.chain.getShardIdByHash(hash);
    await models.CreateShard.update(
        {
            shardId: shardId!
        },
        {
            where: {
                transactionHash: strip0xPrefix(hash)
            }
        }
    );
}

const includeArray = [
    {
        as: "mintAsset",
        model: models.MintAsset
    },
    {
        as: "transferAsset",
        model: models.TransferAsset,
        include: [
            {
                as: "outputs",
                model: models.AssetTransferOutput,
                include: [
                    {
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                as: "inputs",
                model: models.AssetTransferInput,
                include: [
                    {
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                as: "burns",
                model: models.AssetTransferBurn,
                include: [
                    {
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                as: "orders",
                model: models.OrderOnTransfer
            }
        ]
    },
    {
        as: "composeAsset",
        model: models.ComposeAsset,
        include: [
            {
                as: "inputs",
                model: models.AssetTransferInput
            }
        ]
    },
    {
        as: "decomposeAsset",
        model: models.DecomposeAsset,
        include: [
            {
                as: "input",
                model: models.AssetTransferInput
            },
            {
                as: "outputs",
                model: models.AssetTransferOutput
            }
        ]
    },
    {
        as: "changeAssetScheme",
        model: models.ChangeAssetScheme
    },
    {
        as: "increaseAssetSupply",
        model: models.IncreaseAssetSupply
    },
    {
        as: "wrapCCC",
        model: models.WrapCCC
    },
    {
        as: "unwrapCCC",
        model: models.UnwrapCCC,
        include: [
            {
                as: "burn",
                model: models.AssetTransferBurn
            }
        ]
    },
    {
        as: "pay",
        model: models.Pay
    },
    {
        as: "setRegularKey",
        model: models.SetRegularKey
    },
    {
        as: "createShard",
        model: models.CreateShard
    },
    {
        as: "store",
        model: models.Store
    },
    {
        as: "remove",
        model: models.Remove
    },
    {
        as: "custom",
        model: models.Custom
    }
];

async function handleUTXO(txInst: TransactionInstance, blockNumber: number) {
    const tx = txInst.get({ plain: true });
    const networkId = tx.networkId;
    const transactionHash = new H256(tx.hash);
    const transactionTracker = new H256(tx.tracker!);
    const txType = tx.type;
    if (txType === "mintAsset") {
        const mintAsset = (await txInst.getMintAsset())!.get();
        const lockScriptHash = new H160(mintAsset.lockScriptHash);
        const parameters = mintAsset.parameters;
        const recipient = getOwner(lockScriptHash, parameters, networkId);
        const assetType = new H160(mintAsset.assetType);
        const shardId = mintAsset.shardId;
        const quantity = new U64(mintAsset.supply);
        const transactionOutputIndex = 0;
        return await createUTXO(
            recipient,
            {
                assetType,
                shardId,
                lockScriptHash,
                parameters,
                quantity,
                transactionHash,
                transactionTracker,
                transactionOutputIndex
            },
            blockNumber
        );
    }
    if (txType === "transferAsset") {
        const transferAsset = (await txInst.getTransferAsset())!;
        const outputs = (await transferAsset.getOutputs())!.map(output =>
            output.get({ plain: true })
        );
        await Promise.all(
            outputs!.map(
                async (
                    output: AssetTransferOutputAttribute,
                    transactionOutputIndex: number
                ) => {
                    const recipient = getOwner(
                        new H160(output.lockScriptHash),
                        output.parameters,
                        networkId
                    );
                    const assetType = new H160(output.assetType);
                    const shardId = output.shardId;
                    const lockScriptHash = new H160(output.lockScriptHash);
                    const parameters = output.parameters;
                    const quantity = new U64(output.quantity);
                    const orderOnTransfer = (await transferAsset.getOrders()).find(
                        o =>
                            o
                                .get({ plain: true })
                                .outputIndices.includes(transactionOutputIndex)
                    );
                    const order =
                        orderOnTransfer && (await orderOnTransfer.getOrder());
                    const orderHash = order && new H256(order.get().orderHash);
                    return createUTXO(
                        recipient,
                        {
                            assetType,
                            shardId,
                            lockScriptHash,
                            parameters,
                            quantity,
                            orderHash,
                            transactionHash,
                            transactionTracker,
                            transactionOutputIndex
                        },
                        blockNumber
                    );
                }
            )
        );
        const inputs = await transferAsset.getInputs();
        if (inputs) {
            await Promise.all(
                inputs.map(async inputInst => {
                    const input = inputInst.get({ plain: true })!;
                    const prevTracker = input.prevOut.tracker;
                    const prevTransaction = await getSuccessfulTransaction(
                        prevTracker
                    );
                    if (!prevTransaction) {
                        throw Exception.InvalidUTXO();
                    }
                    const utxoInst = await getByTxHashIndex(
                        new H256(prevTransaction.get("hash")),
                        input.prevOut.index
                    );
                    if (!utxoInst) {
                        throw Exception.InvalidUTXO();
                    }
                    return await setUsed(
                        utxoInst.get("id"),
                        blockNumber,
                        transactionHash
                    );
                })
            );
        }
        const burns = await transferAsset.getBurns();
        if (burns) {
            await Promise.all(
                burns.map(async burnInst => {
                    const burn = burnInst.get({ plain: true })!;
                    const prevTracker = burn.prevOut.tracker;
                    const prevTransaction = await getSuccessfulTransaction(
                        prevTracker
                    );
                    if (!prevTransaction) {
                        throw Exception.InvalidUTXO();
                    }
                    const utxoInst = await getByTxHashIndex(
                        new H256(prevTransaction.get("hash")),
                        burn.prevOut.index
                    );
                    if (!utxoInst) {
                        throw Exception.InvalidUTXO();
                    }
                    return setUsed(
                        utxoInst.get("id"),
                        blockNumber,
                        transactionHash
                    );
                })
            );
        }
        return;
    }
    if (txType === "composeAsset") {
        const composeAsset = (await txInst.getComposeAsset())!;
        const inputs = (await composeAsset.getInputs())!;
        await Promise.all(
            inputs!.map(async inputInst => {
                const input = inputInst.get({ plain: true });
                const prevTracker = input.prevOut.tracker;
                const prevTransaction = await getSuccessfulTransaction(
                    prevTracker
                );
                if (!prevTransaction) {
                    throw Exception.InvalidUTXO();
                }
                const utxoInst = await getByTxHashIndex(
                    new H256(prevTransaction.get("hash")),
                    input.prevOut.index
                );
                if (!utxoInst) {
                    throw Exception.InvalidUTXO();
                }
                return setUsed(
                    utxoInst.get("id"),
                    blockNumber,
                    transactionHash
                );
            })
        );
        const output = (await composeAsset.get())!;
        const recipient = getOwner(
            new H160(output.lockScriptHash),
            output.parameters,
            networkId
        );
        const assetType = new H160(output.assetType);
        const shardId = output.shardId;
        const lockScriptHash = new H160(output.lockScriptHash);
        const parameters = output.parameters;
        const quantity = new U64(output.supply);
        const transactionOutputIndex = 0;
        return createUTXO(
            recipient,
            {
                assetType,
                shardId,
                lockScriptHash,
                parameters,
                quantity,
                transactionHash,
                transactionTracker,
                transactionOutputIndex
            },
            blockNumber
        );
    }
    if (txType === "decomposeAsset") {
        const decomposeAsset = (await txInst.getDecomposeAsset())!;
        const input = (await decomposeAsset.getInput())!.get({ plain: true });
        const prevTracker = input.prevOut.tracker;
        const prevTransaction = await getSuccessfulTransaction(prevTracker);
        if (!prevTransaction) {
            throw Exception.InvalidUTXO();
        }
        const utxoInst = await getByTxHashIndex(
            new H256(prevTransaction.get("hash")),
            input.prevOut.index
        );
        if (!utxoInst) {
            throw Exception.InvalidUTXO();
        }
        await setUsed(utxoInst.get("id"), blockNumber, transactionHash);

        const outputs = (await decomposeAsset.getOutputs())!;
        return await Promise.all(
            outputs!.map((outputInst, transactionOutputIndex: number) => {
                const output = outputInst.get({ plain: true });
                const recipient = getOwner(
                    new H160(output.lockScriptHash),
                    output.parameters,
                    networkId
                );
                const assetType = new H160(output.assetType);
                const shardId = output.shardId;
                const lockScriptHash = new H160(output.lockScriptHash);
                const parameters = output.parameters;
                const quantity = new U64(output.quantity);
                return createUTXO(
                    recipient,
                    {
                        assetType,
                        shardId,
                        lockScriptHash,
                        parameters,
                        quantity,
                        transactionHash,
                        transactionTracker,
                        transactionOutputIndex
                    },
                    blockNumber
                );
            })
        );
    }
    if (txType === "increaseAssetSupply") {
        const incAssetSupply = (await txInst.getIncreaseAssetSupply())!.get();

        const assetType = new H160(incAssetSupply.assetType);
        const { shardId, parameters } = incAssetSupply;
        const lockScriptHash = new H160(incAssetSupply.lockScriptHash);
        const quantity = new U64(incAssetSupply.supply);
        const transactionOutputIndex = 0;

        const recipient = getOwner(
            new H160(incAssetSupply.lockScriptHash),
            incAssetSupply.parameters,
            networkId
        );

        return createUTXO(
            recipient,
            {
                assetType,
                shardId,
                lockScriptHash,
                parameters,
                quantity,
                transactionHash,
                transactionTracker,
                transactionOutputIndex
            },
            blockNumber
        );
    }
    if (txType === "wrapCCC") {
        const wrapCCC = (await txInst.getWrapCCC())!.get();

        const recipient = getOwner(
            new H160(wrapCCC.lockScriptHash),
            wrapCCC.parameters,
            networkId
        );

        const assetType = H160.zero();
        const shardId = wrapCCC.shardId;
        const lockScriptHash = new H160(wrapCCC.lockScriptHash);
        const parameters = wrapCCC.parameters;
        const quantity = new U64(wrapCCC.quantity);
        const transactionOutputIndex = 0;
        return createUTXO(
            recipient,
            {
                assetType,
                shardId,
                lockScriptHash,
                parameters,
                quantity,
                transactionHash,
                transactionTracker,
                transactionOutputIndex
            },
            blockNumber
        );
    }
    if (txType === "unwrapCCC") {
        const prevOut = (await (await txInst.getUnwrapCCC())!.getBurn())!.get(
            "prevOut"
        );
        const prevTracker = prevOut.tracker;
        const prevTransaction = await getSuccessfulTransaction(prevTracker);

        if (!prevTransaction) {
            throw Exception.InvalidUTXO();
        }
        const utxoInst = await getByTxHashIndex(
            new H256(prevTransaction.get("hash")),
            prevOut.index
        );
        if (!utxoInst) {
            throw Exception.InvalidUTXO();
        }
        await setUsed(utxoInst.get("id"), blockNumber, transactionHash);
    }
}

function getPendingTransactionsQuery(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
}) {
    const { address, assetType, type } = params;
    const query: any[] = [];
    if (address) {
        addAddressQuery(query, address);
    }
    if (assetType) {
        addAssetTypeQuery(query, assetType);
    }
    if (type) {
        query.push({
            type: {
                [Sequelize.Op.in]: type
            }
        });
    }
    query.push({
        isPending: true
    });
    return query;
}

export async function getPendingTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
}) {
    const { address, assetType, type } = params;
    const query = getPendingTransactionsQuery({ address, assetType, type });
    try {
        const hashes = await models.Transaction.findAll({
            attributes: ["hash"],
            where: {
                [Sequelize.Op.and]: query
            },
            order: [["pendingTimestamp", "DESC"]],
            include: includeArray
        }).then(instances => instances.map(i => strip0xPrefix(i.get().hash)));
        return await models.Transaction.findAll({
            where: {
                hash: {
                    [Sequelize.Op.in]: hashes
                }
            },
            order: [["pendingTimestamp", "DESC"]],
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getNumberOfPendingTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
}) {
    const { address, assetType, type } = params;
    const query = getPendingTransactionsQuery({ address, assetType, type });
    try {
        return await models.Transaction.count({
            where: {
                [Sequelize.Op.and]: query
            },
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByHash(
    hash: H256
): Promise<TransactionInstance | null> {
    try {
        return await models.Transaction.findOne({
            where: {
                hash: strip0xPrefix(hash.value)
            },
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

function addAddressQuery(query: any[], address: string) {
    query.push({
        [Sequelize.Op.or]: [
            { signer: address },
            { "$mintAsset.approver$": address },
            { "$mintAsset.administrator$": address },
            { "$mintAsset.recipient$": address },

            { "$transferAsset.inputs.owner$": address },
            { "$transferAsset.outputs.owner$": address },
            { "$transferAsset.burns.owner$": address },

            { "$composeAsset.approver$": address },
            { "$composeAsset.administrator$": address },
            { "$composeAsset.recipient$": address },
            { "$composeAsset.inputs.owner$": address },

            { "$decomposeAsset.input.owner$": address },
            { "$decomposeAsset.outputs.owner$": address },

            { "$wrapCCC.recipient$": address },
            { "$unwrapCCC.burn.owner$": address },

            { "$increaseAssetSupply.recipient$": address },

            { "$pay.receiver$": address }
        ]
    });
}

function addAssetTypeQuery(query: any[], assetType: H160) {
    query.push({
        [Sequelize.Op.or]: [
            { "$mintAsset.assetType$": assetType.value },
            { "$transferAsset.inputs.assetType$": assetType.value },
            { "$transferAsset.outputs.assetType$": assetType.value },
            { "$transferAsset.burns.assetType$": assetType.value },
            { "$composeAsset.inputs.assetType$": assetType.value },
            { "$decomposeAsset.input.assetType$": assetType.value },
            { "$decomposeAsset.outputs.assetType$": assetType.value },
            { "$unwrapCCC.burn.assetType$": assetType.value },
            { "$changeAssetScheme.assetType$": assetType.value },
            { "$increaseAssetSupply.assetType$": assetType.value }
        ]
    });
}

async function getTransactionsQuery(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    tracker?: H256 | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        type,
        tracker,
        onlyConfirmed,
        onlySuccessful,
        confirmThreshold
    } = params;
    const query: any[] = [];
    if (address) {
        addAddressQuery(query, address);
    }
    if (assetType) {
        addAssetTypeQuery(query, assetType);
    }
    if (type) {
        query.push({
            type: {
                [Sequelize.Op.in]: type
            }
        });
    }
    if (tracker) {
        query.push({ tracker: tracker.value });
    }
    if (onlyConfirmed) {
        const latestBlockInst = await BlockModel.getLatestBlock();
        const latestBlockNumber = latestBlockInst
            ? latestBlockInst.get().number
            : 0;
        query.push({
            blockNumber: {
                [Sequelize.Op.lte]: latestBlockNumber - confirmThreshold!
            }
        });
    }
    if (onlySuccessful) {
        query.push({
            success: true
        });
    }
    query.push({
        isPending: false
    });
    return query;
}

export async function getTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    tracker?: H256 | null;
    page?: number | null;
    itemsPerPage?: number | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        type,
        tracker,
        page = 1,
        itemsPerPage = 15,
        onlyConfirmed = false,
        onlySuccessful = false,
        confirmThreshold = 0
    } = params;
    const query = await getTransactionsQuery({
        address,
        assetType,
        type,
        tracker,
        onlyConfirmed,
        onlySuccessful,
        confirmThreshold
    });
    try {
        const hashes = await models.Transaction.findAll({
            attributes: ["hash"],
            where: {
                [Sequelize.Op.and]: query
            },
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!,
            subQuery: false,
            include: includeArray
        }).then(instances => instances.map(i => strip0xPrefix(i.get().hash)));
        return await models.Transaction.findAll({
            where: {
                hash: {
                    [Sequelize.Op.in]: hashes
                }
            },
            order: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getNumberOfTransactions(params: {
    address?: string | null;
    assetType?: H160 | null;
    type?: string[] | null;
    tracker?: H256 | null;
    onlyConfirmed?: boolean | null;
    onlySuccessful?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        type,
        tracker,
        onlyConfirmed = false,
        onlySuccessful = false,
        confirmThreshold = 0
    } = params;
    const query = await getTransactionsQuery({
        address,
        assetType,
        type,
        tracker,
        onlyConfirmed,
        onlySuccessful,
        confirmThreshold
    });
    try {
        return await models.Transaction.count({
            where: {
                [Sequelize.Op.and]: query
            },
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

// @ts-ignore
export async function deleteByHash(hash: H256) {
    try {
        return await models.Transaction.destroy({
            where: { hash: strip0xPrefix(hash.value) }
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError();
    }
}

export async function getSuccessfulTransaction(
    tracker: string
): Promise<TransactionInstance | null> {
    try {
        return await models.Transaction.findOne({
            where: {
                tracker: strip0xPrefix(tracker),
                success: true
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
