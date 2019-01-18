import * as Sequelize from "sequelize";
import {
    AssetTransferInputAttribute,
    AssetTransferInputInstance
} from "./assettransferinput";
import {
    AssetTransferOutputAttribute,
    AssetTransferOutputInstance
} from "./assettransferoutput";

export interface ComposeAssetAttribute {
    transactionHash: string;
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    allowedScriptHashes: string[];

    approvals: string[];
    assetName?: string;
    inputs?: AssetTransferInputAttribute[];
    output?: AssetTransferOutputAttribute;
}

export interface ComposeAssetInstance
    extends Sequelize.Instance<ComposeAssetAttribute> {
    getInputs: Sequelize.HasManyGetAssociationsMixin<
        AssetTransferInputInstance
    >;
    getOutput: Sequelize.HasOneGetAssociationMixin<AssetTransferOutputInstance>;
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

            assetName: {
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
        Action.hasOne(models.AssetTransferOutput, {
            foreignKey: "transactionHash",
            as: "output",
            onDelete: "CASCADE"
        });
    };
    return Action;
};
