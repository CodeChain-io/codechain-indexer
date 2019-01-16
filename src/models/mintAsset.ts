import * as Sequelize from "sequelize";
import {
    AssetMintOutputAttribute,
    AssetMintOutputInstance
} from "./assetmintoutput";

export interface MintAssetAttribute {
    transactionHash: string;
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    approvals: string[];
    assetName?: string;
    output?: AssetMintOutputAttribute;
}

export interface MintAssetInstance
    extends Sequelize.Instance<MintAssetAttribute> {
    getOutput: Sequelize.HasOneGetAssociationMixin<AssetMintOutputInstance>;
}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Action = sequelize.define(
        "MintAsset",
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
                type: DataTypes.STRING
            },
            administrator: {
                type: DataTypes.STRING
            },
            approvals: {
                allowNull: false,
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
        Action.hasOne(models.AssetMintOutput, {
            foreignKey: "transactionHash",
            as: "output",
            onDelete: "CASCADE"
        });
    };
    return Action;
};
