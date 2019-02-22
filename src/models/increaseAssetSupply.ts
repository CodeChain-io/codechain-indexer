import * as Sequelize from "sequelize";

export interface IncreaseAssetSupplyAttribute {
    transactionHash: string;
    networkId: string;
    shardId: number;
    approvals: string[];

    lockScriptHash: string;
    parameters: string[];
    supply: string;

    assetType: string;
    recipient: string;
}

export interface IncreaseAssetSupplyInstance
    extends Sequelize.Instance<IncreaseAssetSupplyAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    return sequelize.define(
        "IncreaseAssetSupply",
        {
            transactionHash: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING,
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
            shardId: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            assetType: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{40}$"]
                }
            },
            approvals: {
                allowNull: false,
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
};
