import * as Sequelize from "sequelize";

export interface AssetSchemeAttribute {
    transactionHash: string;
    assetType: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    allowedScriptHashes: string[];
    supply?: string | null;
    networkId?: string | null;
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
                primaryKey: true,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            assetType: {
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
