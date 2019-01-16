import * as Sequelize from "sequelize";
import {
    AssetTransferInputAttribute,
    AssetTransferInputInstance
} from "./assettransferinput";
import {
    AssetTransferOutputAttribute,
    AssetTransferOutputInstance
} from "./assettransferoutput";

export interface DecomposeAssetAttribute {
    transactionHash: string;
    networkId: string;
    approvals: string[];
    input?: AssetTransferInputAttribute;
    outputs?: AssetTransferOutputAttribute[];
}

export interface DecomposeAssetInstance
    extends Sequelize.Instance<DecomposeAssetAttribute> {
    getInput: Sequelize.HasOneGetAssociationMixin<AssetTransferInputInstance>;
    getOutputs: Sequelize.HasManyGetAssociationsMixin<
        AssetTransferOutputInstance
    >;
}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Action = sequelize.define(
        "DecomposeAsset",
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
            approvals: {
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
    Action.associate = models => {
        Action.hasMany(models.AssetTransferOutput, {
            foreignKey: "transactionHash",
            as: "outputs",
            onDelete: "CASCADE"
        });
        Action.hasOne(models.AssetTransferInput, {
            foreignKey: "transactionHash",
            as: "input",
            onDelete: "CASCADE"
        });
    };
    return Action;
};
