import * as Sequelize from "sequelize";
import { AssetTransferInput } from "./transferAsset";

export interface ComposeAssetAttribute {
    transactionHash: string;
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    registrar?: string | null;
    allowedScriptHashes: string[];

    approvals: string[];

    lockScriptHash: string;
    parameters: string[];
    supply: string;

    assetName?: string;
    assetType: string;
    recipient: string;

    inputs: AssetTransferInput[];
}

export type ComposeAssetInstance = Sequelize.Instance<ComposeAssetAttribute>;

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
                },
                validate: {
                    is: ["^[a-f0-9]{64}$"]
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
                type: DataTypes.TEXT
            },
            approver: {
                type: DataTypes.STRING
            },
            registrar: {
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
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{40}$"]
                }
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
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{40}$"]
                }
            },
            recipient: {
                allowNull: false,
                type: DataTypes.STRING
            },
            inputs: {
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
