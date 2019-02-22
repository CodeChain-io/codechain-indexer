import * as Sequelize from "sequelize";
import { AssetTransferBurnInstance } from "./assettransferburn";
import { AssetTransferInputAttribute } from "./assettransferinput";

export interface UnwrapCCCAttribute {
    transactionHash: string;
    burn?: AssetTransferInputAttribute;
}

export interface UnwrapCCCInstance
    extends Sequelize.Instance<UnwrapCCCAttribute> {
    getBurn: Sequelize.HasOneGetAssociationMixin<AssetTransferBurnInstance>;
}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Action = sequelize.define(
        "UnwrapCCC",
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
        Action.hasOne(models.AssetTransferBurn, {
            foreignKey: "transactionHash",
            as: "burn",
            onDelete: "CASCADE"
        });
    };
    return Action;
};
