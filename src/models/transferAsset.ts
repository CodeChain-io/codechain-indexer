import * as Sequelize from "sequelize";
import {
    AssetTransferInputAttribute,
    AssetTransferInputInstance
} from "./assettransferinput";
import {
    AssetTransferOutputAttribute,
    AssetTransferOutputInstance
} from "./assettransferoutput";
import {
    OrderOnTransferAttribute,
    OrderOnTransferInstance
} from "./orderontransfer";

export interface TransferAssetAttribute {
    transactionHash: string;
    networkId: string;
    metadata: string;
    approvals: string[];
    expiration?: string | null;
    inputs?: AssetTransferInputAttribute[];
    burns?: AssetTransferInputAttribute[];
    outputs?: AssetTransferOutputAttribute[];
    orders?: OrderOnTransferAttribute[];
}

export interface TransferAssetInstance
    extends Sequelize.Instance<TransferAssetAttribute> {
    getInputs: Sequelize.HasManyGetAssociationsMixin<
        AssetTransferInputInstance
    >;
    getBurns: Sequelize.HasManyGetAssociationsMixin<AssetTransferInputInstance>;
    getOutputs: Sequelize.HasManyGetAssociationsMixin<
        AssetTransferOutputInstance
    >;
    getOrders: Sequelize.HasManyGetAssociationsMixin<OrderOnTransferInstance>;
}

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
    Action.associate = models => {
        Action.hasMany(models.AssetTransferOutput, {
            foreignKey: "transactionHash",
            as: "outputs",
            onDelete: "CASCADE"
        });
        Action.hasMany(models.AssetTransferInput, {
            foreignKey: "transactionHash",
            as: "inputs",
            onDelete: "CASCADE"
        });
        Action.hasMany(models.AssetTransferBurn, {
            foreignKey: "transactionHash",
            as: "burns",
            onDelete: "CASCADE"
        });
        Action.hasMany(models.OrderOnTransfer, {
            foreignKey: "transactionHash",
            as: "orders",
            onDelete: "CASCADE"
        });
    };
    return Action;
};
