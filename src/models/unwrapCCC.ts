import * as Sequelize from "sequelize";
import { AssetTransferInput } from "./transferAsset";

export interface UnwrapCCCAttribute {
    transactionHash: string;
    receiver: string;
    burn: AssetTransferInput;
}

export type UnwrapCCCInstance = Sequelize.Instance<UnwrapCCCAttribute>;

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
            receiver: {
                allowNull: false,
                type: DataTypes.STRING
            },
            burn: {
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
