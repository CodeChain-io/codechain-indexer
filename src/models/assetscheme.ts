import * as Sequelize from "sequelize";

export interface AssetSchemeAttribute {
    transactionHash: string;
    assetType: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    registrar?: string | null;
    allowedScriptHashes: string[];
    supply?: string | null;
    networkId?: string | null;
    seq: number;
}

export interface AssetSchemeInstance
    extends Sequelize.Instance<AssetSchemeAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AssetScheme = sequelize.define(
        "AssetScheme",
        {
            transactionHash: {
                allowNull: false,
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
            assetType: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{40}$"]
                }
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
            supply: {
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            networkId: {
                type: DataTypes.STRING
            },
            seq: {
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
    AssetScheme.associate = () => {
        // associations can be defined here
    };
    return AssetScheme;
};
