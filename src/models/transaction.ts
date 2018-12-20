import { Timelock } from "codechain-sdk/lib/core/classes";
import * as Sequelize from "sequelize";
import { AssetSchemeAttribute } from "./assetscheme";

export type TransactionAttribute =
    | AssetMintTransactionAttribute
    | AssetTransferTransactionAttribute
    | AssetComposeTransactionAttribute
    | AssetDecomposeTransactionAttribute;

export interface AssetMintTransactionAttribute {
    type: "assetMint";
    actionId: string;
    output: AssetMintOutputAttribute;
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    hash: string;
    timestamp: number;
    assetName?: string | null;
    parcelHash: string;
    blockNumber: number;
    parcelIndex: number;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface AssetMintOutputAttribute {
    lockScriptHash: string;
    parameters: Buffer[];
    amount?: string | null;
    approver?: string | null;
    administrator?: string | null;
    assetType: string;
}

export interface AssetTransferInputAttribute {
    prevOut: AssetOutPointAttribute;
    timelock?: Timelock | null;
    lockScript: Buffer;
    unlockScript: Buffer;
}

export interface AssetTransferOutputAttribute {
    lockScriptHash: string;
    parameters: Buffer[];
    assetType: string;
    amount: string;
    owner?: string | null;
    assetScheme: AssetSchemeAttribute;
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

export interface AssetTransferTransactionAttribute {
    type: "assetTransfer";
    actionId: string;
    networkId: string;
    burns: AssetTransferInputAttribute[];
    inputs: AssetTransferInputAttribute[];
    outputs: AssetTransferOutputAttribute[];
    hash: string;
    timestamp: number;
    parcelHash: string;
    blockNumber: number;
    parcelIndex: number;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface AssetComposeTransactionAttribute {
    type: "assetCompose";
    actionId: string;
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    output: AssetMintOutputAttribute;
    inputs: AssetTransferInputAttribute[];
    hash: string;
    timestamp: number;
    assetName?: string | null;
    parcelHash: string;
    blockNumber: number;
    parcelIndex: number;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface AssetDecomposeTransactionAttribute {
    type: "assetDecompose";
    actionId: string;
    input: AssetTransferInputAttribute;
    outputs: AssetTransferOutputAttribute[];
    networkId: string;
    hash: string;
    timestamp: number;
    parcelHash: string;
    blockNumber: number;
    parcelIndex: number;
    invoice?: boolean | null;
    errorType?: string | null;
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
            output: {
                type: DataTypes.JSONB
            },
            burns: {
                type: DataTypes.JSONB
            },
            input: {
                type: DataTypes.JSONB
            },
            inputs: {
                type: DataTypes.JSONB
            },
            outputs: {
                type: DataTypes.JSONB
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
                allowNull: false,
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
                allowNull: false,
                type: DataTypes.INTEGER
            },
            parcelIndex: {
                allowNull: false,
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
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE
            }
        },
        {}
    );
    Transaction.associate = () => {
        //
    };
    return Transaction;
};
