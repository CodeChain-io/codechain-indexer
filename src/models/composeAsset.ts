import * as Sequelize from "sequelize";
import {
    AssetTransferInputAttribute,
    AssetTransferInputInstance
} from "./assettransferinput";

export interface ComposeAssetAttribute {
    transactionHash: string;
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    allowedScriptHashes: string[];

    approvals: string[];

    lockScriptHash: string;
    parameters: string[];
    supply: string;

    assetName?: string;
    assetType: string;
    recipient: string;

    inputs?: AssetTransferInputAttribute[];
}

export interface ComposeAssetInstance
    extends Sequelize.Instance<ComposeAssetAttribute> {
    getInputs: Sequelize.HasManyGetAssociationsMixin<
        AssetTransferInputInstance
    >;
}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Action = sequelize.define(
        "ComposeAsset",
        {
            transactionHash: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },

            networkId: {
                allowNull: false,
                type: DataTypes.STRING
            },
            shardId: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            metadata: {
                allowNull: false,
                type: DataTypes.STRING
            },
            approver: {
                allowNull: false,
                type: DataTypes.STRING
            },
            administrator: {
                type: DataTypes.STRING
            },
            allowedScriptHashes: {
                allowNull: false,
                type: DataTypes.JSONB
            },

            approvals: {
                type: DataTypes.JSONB
            },

            lockScriptHash: {
                allowNull: false,
                type: DataTypes.STRING
            },
            parameters: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            supply: {
                allowNull: false,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },

            assetName: {
                type: DataTypes.STRING
            },
            assetType: {
                allowNull: false,
                type: DataTypes.STRING
            },
            recipient: {
                allowNull: false,
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
    Action.associate = models => {
        Action.hasMany(models.AssetTransferInput, {
            foreignKey: "transactionHash",
            as: "inputs",
            onDelete: "CASCADE"
        });
    };
    return Action;
};
