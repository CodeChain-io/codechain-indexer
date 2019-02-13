import { H160, H256, U64 } from "codechain-sdk/lib/core/classes";
import * as Sequelize from "sequelize";
import models from "..";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { UTXOAttribute, UTXOInstance } from "../utxo";
import * as AssetSchemeModel from "./assetscheme";
import * as BlockModel from "./block";

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
            assetType: utxo.assetType.value,
            shardId: utxo.shardId,
            lockScriptHash: utxo.lockScriptHash.value,
            parameters: utxo.parameters,
            quantity: utxo.quantity.value.toString(10),
            orderHash: utxo.orderHash ? utxo.orderHash.value : null,
            transactionHash: utxo.transactionHash.value,
            transactionTracker: utxo.transactionTracker.value,
            transactionOutputIndex: utxo.transactionOutputIndex,
            assetScheme,
            blockNumber
        });
    } catch (err) {
        console.error(err, utxo.assetType.value);
        throw Exception.DBError;
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
                usedTransactionHash: usedTransactionHash.value,
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
        throw Exception.DBError;
    }
}

async function getAssetSheme(assetType: H160): Promise<AssetSchemeAttribute> {
    const assetSchemeInstance = await AssetSchemeModel.getByAssetType(
        assetType
    );
    if (!assetSchemeInstance) {
        throw Exception.InvalidTransaction;
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
        throw Exception.DBError;
    }
}

export async function getByAssetType(assetType: H160) {
    try {
        return await models.UTXO.findAll({
            where: {
                assetType: assetType.value,
                usedTransactionHash: null
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

async function getUTXOQuery(params: {
    address?: string | null;
    assetType?: H160 | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const { address, onlyConfirmed, confirmThreshold, assetType } = params;
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
                    [Sequelize.Op.not]: {
                        [Sequelize.Op.and]: [
                            {
                                usedTransactionHash: {
                                    [Sequelize.Op.not]: null
                                }
                            },
                            {
                                $usedTransaction$: null
                            }
                        ]
                    }
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
    page?: number | null;
    itemsPerPage?: number | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        page = 1,
        itemsPerPage = 15,
        onlyConfirmed = false,
        confirmThreshold = 0
    } = params;
    const query: any = await getUTXOQuery({
        address,
        assetType,
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
        throw Exception.DBError;
    }
}

export async function getAggsUTXO(params: {
    address?: string | null;
    assetType?: H160 | null;
    page?: number | null;
    itemsPerPage?: number | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        page = 1,
        itemsPerPage = 15,
        onlyConfirmed = false,
        confirmThreshold = 0
    } = params;
    const query: any = await getUTXOQuery({
        address,
        assetType,
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
            group: ["UTXO.assetType", "assetScheme.assetType"]
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getCountOfAggsUTXO(params: {
    address?: string | null;
    assetType?: H160 | null;
    onlyConfirmed?: boolean | null;
    confirmThreshold?: number | null;
}) {
    const {
        address,
        assetType,
        onlyConfirmed = false,
        confirmThreshold = 0
    } = params;
    const query: any = await getUTXOQuery({
        address,
        assetType,
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
        throw Exception.DBError;
    }
}

export async function getByTxHashIndex(
    transactionHash: H256,
    outputIndex: number
) {
    try {
        return await models.UTXO.findOne({
            where: {
                transactionHash: transactionHash.value,
                transactionOutputIndex: outputIndex
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getSnapshot(
    assetType: H256,
    blockNumber: number
): Promise<UTXOAttribute[]> {
    try {
        const utxoInsts = await models.UTXO.findAll({
            where: {
                assetType: assetType.value,
                usedBlockNumber: {
                    [Sequelize.Op.or]: [
                        { [Sequelize.Op.gt]: blockNumber },
                        { [Sequelize.Op.eq]: null }
                    ]
                },
                blockNumber: {
                    [Sequelize.Op.lte]: blockNumber
                }
            }
        });

        return utxoInsts.map(utxoInst => {
            const utxo = utxoInst.get({ plain: true });
            utxo.usedBlockNumber = null;
            utxo.usedTransactionHash = null;
            return utxo;
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
