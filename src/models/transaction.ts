import { Timelock } from "codechain-sdk/lib/core/classes";
import * as Sequelize from "sequelize";
import { AssetMintOutputAttribute } from "./assetmintoutput";
import { AssetSchemeAttribute } from "./assetscheme";
import { AssetTransferOutputAttribute } from "./assettransferoutput";

export type TransactionAttribute =
    | AssetMintTransactionAttribute
    | AssetTransferTransactionAttribute
    | AssetComposeTransactionAttribute
    | AssetDecomposeTransactionAttribute;

interface TransactionCommon {
    isPending: boolean;
    pendingTimestamp?: number | null;
    blockNumber?: number | null;
    parcelIndex?: number | null;
    invoice?: boolean | null;
    errorType?: string | null;
    timestamp?: number | null;
    hash: string;
    parcelHash: string;
    actionId: string;
    networkId: string;
}

export interface AssetMintTransactionAttribute extends TransactionCommon {
    type: "assetMint";
    output?: AssetMintOutputAttribute;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    assetName?: string | null;
}

export interface AssetTransferInputAttribute {
    id?: string;
    transactionHash: string;
    prevOut: AssetOutPointAttribute;
    timelock?: Timelock | null;
    owner?: string | null;
    assetType: string;
    lockScript: Buffer;
    unlockScript: Buffer;
}

export interface AssetOutPointAttribute {
    transactionHash: string;
    index: number;
    assetType: string;
    assetScheme: AssetSchemeAttribute;
    amount: string;
    owner?: string | null;
    lockScriptHash?: string | null;
    parameters?: Buffer[] | null;
}

export interface AssetTransferTransactionAttribute extends TransactionCommon {
    type: "assetTransfer";
    burns?: AssetTransferInputAttribute[];
    inputs?: AssetTransferInputAttribute[];
    outputs?: AssetTransferOutputAttribute[];
}

export interface AssetComposeTransactionAttribute extends TransactionCommon {
    type: "assetCompose";
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    output?: AssetMintOutputAttribute;
    inputs?: AssetTransferInputAttribute[];
    assetName?: string | null;
}

export interface AssetDecomposeTransactionAttribute extends TransactionCommon {
    type: "assetDecompose";
    input?: AssetTransferInputAttribute;
    outputs?: AssetTransferOutputAttribute[];
}

export interface TransactionInstance
    extends Sequelize.Instance<TransactionAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Transaction = sequelize.define(
        "Transaction",
        {
            hash: {
                primaryKey: true,
                allowNull: false,
                type: DataTypes.STRING
            },
            actionId: {
                allowNull: false,
                type: DataTypes.BIGINT,
                onDelete: "CASCADE",
                references: {
                    model: "Actions",
                    key: "id"
                }
            },
            networkId: {
                type: DataTypes.STRING
            },
            shardId: {
                type: DataTypes.INTEGER
            },
            metadata: {
                type: DataTypes.STRING
            },
            approver: {
                type: DataTypes.STRING
            },
            administrator: {
                type: DataTypes.STRING
            },
            timestamp: {
                type: DataTypes.INTEGER
            },
            assetName: {
                type: DataTypes.STRING
            },
            parcelHash: {
                allowNull: false,
                type: DataTypes.STRING
            },
            blockNumber: {
                type: DataTypes.INTEGER
            },
            parcelIndex: {
                type: DataTypes.INTEGER
            },
            invoice: {
                type: DataTypes.BOOLEAN
            },
            errorType: {
                type: DataTypes.STRING
            },
            createdAt: {
                allowNull: false,
                type: DataTypes.DATE
            },
            isPending: {
                allowNull: false,
                type: DataTypes.BOOLEAN
            },
            pendingTimestamp: {
                type: DataTypes.INTEGER
            },
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE
            }
        },
        {}
    );
    Transaction.associate = models => {
        Transaction.hasMany(models.AssetTransferOutput, {
            foreignKey: "transactionHash",
            as: "outputs",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.AssetMintOutput, {
            foreignKey: "transactionHash",
            as: "output",
            onDelete: "CASCADE"
        });
        Transaction.hasMany(models.AssetTransferInput, {
            foreignKey: "transactionHash",
            as: "inputs",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.AssetDecomposeInput, {
            foreignKey: "transactionHash",
            as: "input",
            onDelete: "CASCADE"
        });
    };
    return Transaction;
};
