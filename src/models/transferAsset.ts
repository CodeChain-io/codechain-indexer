import { Timelock } from "codechain-sdk/lib/core/classes";
import * as Sequelize from "sequelize";

// FIXME: Move to common
export interface AssetOutPoint {
    tracker: string;
    hash?: string | null;
    index: number;
    assetType: string;
    shardId: number;
    quantity: string;
    owner?: string | null;
    lockScriptHash?: string | null;
    parameters?: string[] | null;
}

// FIXME: Move to common
export interface AssetTransferInput {
    index: number;
    prevOut: AssetOutPoint;
    timelock?: Timelock | null;
    owner?: string | null;
    assetType: string;
    shardId: number;
    lockScript: Buffer;
    unlockScript: Buffer;
}

// FIXME: Move to common
export interface AssetTransferOutput {
    index: number;
    lockScriptHash: string;
    parameters: string[];
    assetType: string;
    shardId: number;
    quantity: string;
    owner?: string | null;
}

// FIXME: Move to common
export interface Order {
    orderHash: string;

    assetTypeFrom: string;
    assetTypeTo: string;
    assetTypeFee: string;
    shardIdFrom: number;
    shardIdTo: number;
    shardIdFee: number;
    assetQuantityFrom: string;
    assetQuantityTo: string;
    assetQuantityFee: string;

    originOutputs: AssetOutPoint[];
    expiration: string;
    lockScriptHashFrom: string;
    parametersFrom: string[];
    lockScriptHashFee: string;
    parametersFee: string[];
}

// FIXME: Move to common
export interface OrderOnTransfer {
    index: number;
    order: Order;
    spentQuantity: string;
    inputFromIndices: number[];
    inputFeeIndices: number[];
    outputFromIndices: number[];
    outputToIndices: number[];
    outputOwnedFeeIndices: number[];
    outputTransferredFeeIndices: number[];
}

export interface TransferAssetAttribute {
    transactionHash: string;
    networkId: string;
    metadata: string;
    approvals: string[];
    expiration?: string | null;
    inputs: AssetTransferInput[];
    burns: AssetTransferInput[];
    outputs: AssetTransferOutput[];
    orders: OrderOnTransfer[];
}

export type TransferAssetInstance = Sequelize.Instance<TransferAssetAttribute>;

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Action = sequelize.define(
        "TransferAsset",
        {
            transactionHash: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                },
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },

            networkId: {
                allowNull: false,
                type: DataTypes.STRING
            },
            metadata: {
                allowNull: false,
                type: DataTypes.STRING
            },
            approvals: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            expiration: {
                allowNull: true,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            inputs: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            burns: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            outputs: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            orders: {
                allowNull: false,
                type: DataTypes.JSONB
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
    Action.associate = () => {
        // associations can be defined here
    };
    return Action;
};
