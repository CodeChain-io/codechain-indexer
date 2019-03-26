import * as Sequelize from "sequelize";
import { AssetTransferInput, AssetTransferOutput } from "./transferAsset";

export interface DecomposeAssetAttribute {
    transactionHash: string;
    networkId: string;
    approvals: string[];
    input: AssetTransferInput;
    outputs: AssetTransferOutput[];
}

export type DecomposeAssetInstance = Sequelize.Instance<
    DecomposeAssetAttribute
>;

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
                validate: {
                    is: ["^[a-f0-9]{40}$"]
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
            approvals: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            input: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            outputs: {
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
