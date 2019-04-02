import { H160, H256, U64 } from "codechain-sdk/lib/core/classes";
import * as Sequelize from "sequelize";
import models from "..";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { TransactionInstance } from "../transaction";
import { AssetTransferOutput } from "../transferAsset";
import { UTXOInstance } from "../utxo";
import * as AssetSchemeModel from "./assetscheme";
import * as BlockModel from "./block";
import { getSuccessfulByTracker } from "./transaction";
import { getOwner } from "./utils/address";
import { strip0xPrefix } from "./utils/format";

export async function createUTXO(
    address: string,
    utxo: {
        assetType: H160;
        shardId: number;
        lockScriptHash: H160;
        parameters: string[];
        quantity: U64;
        orderHash?: H256 | null;
        transactionHash: H256;
        transactionTracker: H256;
        transactionOutputIndex: number;
    },
    blockNumber: number
): Promise<UTXOInstance> {
    let utxoInstance;
    try {
        const assetScheme = await getAssetSheme(utxo.assetType);
        utxoInstance = await models.UTXO.create({
            address,
            assetType: strip0xPrefix(utxo.assetType.value),
            shardId: utxo.shardId,
            lockScriptHash: strip0xPrefix(utxo.lockScriptHash.value),
            parameters: utxo.parameters.map(p => strip0xPrefix(p)),
            quantity: utxo.quantity.value.toString(10),
            orderHash: utxo.orderHash
                ? strip0xPrefix(utxo.orderHash.value)
                : null,
            transactionHash: strip0xPrefix(utxo.transactionHash.value),
            transactionTracker: strip0xPrefix(utxo.transactionTracker.value),
            transactionOutputIndex: utxo.transactionOutputIndex,
            assetScheme,
            blockNumber
        });
    } catch (err) {
        console.error(err, utxo.assetType.value);
        throw Exception.DBError();
    }
    return utxoInstance;
}

export async function setUsed(
    id: string,
    blockNumber: number,
    usedTransactionHash: H256
) {
    try {
        return await models.UTXO.update(
            {
                usedTransactionHash: strip0xPrefix(usedTransactionHash.value),
                usedBlockNumber: blockNumber
            },
            {
                where: {
                    id
                }
            }
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

async function getAssetSheme(assetType: H160): Promise<AssetSchemeAttribute> {
    const assetSchemeInstance = await AssetSchemeModel.getByAssetType(
        assetType
    );
    if (!assetSchemeInstance) {
        throw Exception.InvalidTransaction();
    }
    return assetSchemeInstance.get({
        plain: true
    });
}

export async function getByAddress(address: string): Promise<UTXOInstance[]> {
    try {
        return await models.UTXO.findAll({
            where: {
                address,
                usedTransactionHash: null
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByAssetType(assetType: H160) {
    try {
        return await models.UTXO.findAll({
            where: {
                assetType: strip0xPrefix(assetType.value),
                usedTransactionHash: null
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

async function getUTXOQuery(params: {
    address?: string | null;
    assetType?: H160 | null;
    shardId?: number | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        shardId,
        onlyConfirmed,
        confirmThreshold,
        assetType
    } = params;
    const query = [];
    if (address) {
        query.push({
            address
        });
    }
    if (assetType) {
        query.push({
            assetType: assetType.value
        });
    }
    if (shardId != null) {
        query.push({
            shardId
        });
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
        query.push({
            [Sequelize.Op.or]: [
                {
                    usedTransactionHash: null
                },
                {
                    $usedTransaction$: null
                }
            ]
        });
    } else {
        query.push({
            usedTransactionHash: null
        });
    }
    return query;
}

export async function getUTXO(params: {
    address?: string | null;
    assetType?: H160 | null;
    shardId?: number | null;
    page?: number | null;
    itemsPerPage?: number | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        shardId,
        page = 1,
        itemsPerPage = 15,
        onlyConfirmed = false,
        confirmThreshold = 0
    } = params;
    const query: any = await getUTXOQuery({
        address,
        assetType,
        shardId,
        onlyConfirmed,
        confirmThreshold
    });
    let includeArray: any = [
        {
            as: "usedTransaction",
            model: models.Transaction
        },
        {
            as: "assetScheme",
            model: models.AssetScheme
        }
    ];
    if (onlyConfirmed) {
        const latestBlockInst = await BlockModel.getLatestBlock();
        const latestBlockNumber = latestBlockInst
            ? latestBlockInst.get().number
            : 0;
        includeArray = [
            {
                as: "usedTransaction",
                model: models.Transaction,
                required: false,
                where: {
                    blockNumber: {
                        [Sequelize.Op.lte]:
                            latestBlockNumber - confirmThreshold!
                    }
                }
            },
            {
                as: "assetScheme",
                model: models.AssetScheme
            }
        ];
    }
    try {
        return await models.UTXO.findAll({
            where: {
                [Sequelize.Op.and]: query
            },
            order: [["id", "DESC"]],
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!,
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getAggsUTXO(params: {
    address?: string | null;
    assetType?: H160 | null;
    shardId?: number | null;
    page?: number | null;
    itemsPerPage?: number | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        shardId,
        page = 1,
        itemsPerPage = 15,
        onlyConfirmed = false,
        confirmThreshold = 0
    } = params;
    const query: any = await getUTXOQuery({
        address,
        assetType,
        shardId,
        onlyConfirmed,
        confirmThreshold
    });
    let includeArray: any = [
        {
            as: "assetScheme",
            model: models.AssetScheme
        }
    ];
    if (onlyConfirmed) {
        const latestBlockInst = await BlockModel.getLatestBlock();
        const latestBlockNumber = latestBlockInst
            ? latestBlockInst.get().number
            : 0;
        includeArray = [
            {
                as: "usedTransaction",
                model: models.Transaction,
                required: false,
                where: {
                    blockNumber: {
                        [Sequelize.Op.lte]:
                            latestBlockNumber - confirmThreshold!
                    }
                },
                attributes: []
            },
            {
                as: "assetScheme",
                model: models.AssetScheme
            }
        ];
    }
    try {
        return await models.UTXO.findAll({
            where: {
                [Sequelize.Op.and]: query
            },
            attributes: [
                [
                    Sequelize.fn("SUM", Sequelize.col("quantity")),
                    "totalAssetQuantity"
                ],
                "address",
                "assetType",
                [
                    Sequelize.fn("COUNT", Sequelize.col("UTXO.assetType")),
                    "utxoQuantity"
                ]
            ],
            order: Sequelize.literal(
                `"totalAssetQuantity" DESC, "assetType" DESC`
            ),
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!,
            include: includeArray,
            group: ["UTXO.address", "UTXO.assetType", "assetScheme.assetType"]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getCountOfAggsUTXO(params: {
    address?: string | null;
    assetType?: H160 | null;
    shardId?: number | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        shardId,
        onlyConfirmed = false,
        confirmThreshold = 0
    } = params;
    const query: any = await getUTXOQuery({
        address,
        assetType,
        shardId,
        onlyConfirmed,
        confirmThreshold
    });
    let includeArray: any = [];
    if (onlyConfirmed) {
        const latestBlockInst = await BlockModel.getLatestBlock();
        const latestBlockNumber = latestBlockInst
            ? latestBlockInst.get().number
            : 0;
        includeArray = [
            {
                as: "usedTransaction",
                model: models.Transaction,
                required: false,
                where: {
                    blockNumber: {
                        [Sequelize.Op.lte]:
                            latestBlockNumber - confirmThreshold!
                    }
                },
                attributes: []
            }
        ];
    }
    try {
        return await models.UTXO.count({
            where: {
                [Sequelize.Op.and]: query
            },
            distinct: true,
            col: "assetType",
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByTxHashIndex(
    transactionHash: H256,
    outputIndex: number
) {
    try {
        return await models.UTXO.findOne({
            where: {
                transactionHash: strip0xPrefix(transactionHash.value),
                transactionOutputIndex: outputIndex
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByTxTrackerIndex(
    transactionTracker: H256,
    outputIndex: number
) {
    try {
        return await models.UTXO.findOne({
            where: {
                transactionTracker: strip0xPrefix(transactionTracker.value),
                transactionOutputIndex: outputIndex
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getSnapshot(assetType: H256, blockNumber: number) {
    try {
        return models.UTXO.findAll({
            where: {
                assetType: strip0xPrefix(assetType.value),
                usedBlockNumber: {
                    [Sequelize.Op.or]: [
                        { [Sequelize.Op.gt]: blockNumber },
                        { [Sequelize.Op.eq]: null }
                    ]
                },
                blockNumber: {
                    [Sequelize.Op.lte]: blockNumber
                }
            },
            attributes: [
                [
                    Sequelize.fn("SUM", Sequelize.col("quantity")),
                    "totalAssetQuantity"
                ],
                "address",
                "assetType",
                [
                    Sequelize.fn("COUNT", Sequelize.col("UTXO.assetType")),
                    "utxoQuantity"
                ]
            ],
            order: Sequelize.literal(
                `"totalAssetQuantity" DESC, "assetType" DESC`
            ),
            include: [
                {
                    as: "assetScheme",
                    model: models.AssetScheme
                }
            ],
            group: ["UTXO.address", "UTXO.assetType", "assetScheme.assetType"]
        }).then(instances =>
            instances.map(instance => instance.get({ plain: true }))
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function transferUTXO(
    txInst: TransactionInstance,
    blockNumber: number
) {
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
        const { outputs, orders } = transferAsset.get({ plain: true });
        await Promise.all(
            outputs!.map(async (output: AssetTransferOutput) => {
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
                const orderOnTransfer = orders.find(o =>
                    o.outputIndices.includes(output.index)
                );
                const order = orderOnTransfer && orderOnTransfer.order;
                const orderHash = order && new H256(order.orderHash);
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
                        transactionOutputIndex: output.index
                    },
                    blockNumber
                );
            })
        );
        const { inputs } = await transferAsset.get({ plain: true });
        if (inputs) {
            await Promise.all(
                inputs.map(async input => {
                    const prevTracker = input.prevOut.tracker;
                    const prevTransaction = await getSuccessfulByTracker(
                        new H256(prevTracker)
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
        const { burns } = await transferAsset.get({ plain: true });
        if (burns) {
            await Promise.all(
                burns.map(async burn => {
                    const prevTracker = burn.prevOut.tracker;
                    const prevTransaction = await getSuccessfulByTracker(
                        new H256(prevTracker)
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
        const { inputs } = await composeAsset.get({ plain: true });
        await Promise.all(
            inputs!.map(async input => {
                const prevTracker = input.prevOut.tracker;
                const prevTransaction = await getSuccessfulByTracker(
                    new H256(prevTracker)
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
        const { input } = await decomposeAsset.get({ plain: true });
        const prevTracker = input.prevOut.tracker;
        const prevTransaction = await getSuccessfulByTracker(
            new H256(prevTracker)
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
        await setUsed(utxoInst.get("id"), blockNumber, transactionHash);

        const { outputs } = (await decomposeAsset.get({ plain: true }))!;
        return await Promise.all(
            outputs!.map(output => {
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
                        transactionOutputIndex: output.index
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
        const {
            burn: { prevOut }
        } = await (await txInst.getUnwrapCCC())!.get({ plain: true });
        const prevTracker = prevOut.tracker;
        const prevTransaction = await getSuccessfulByTracker(
            new H256(prevTracker)
        );

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
