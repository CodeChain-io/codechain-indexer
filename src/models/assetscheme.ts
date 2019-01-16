import * as Sequelize from "sequelize";

export interface AssetSchemeAttribute {
    transactionHash: string;
    assetType: string;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    amount?: string | null;
    networkId?: string | null;
    shardId?: number | null;
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
            amount: {
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            networkId: {
                type: DataTypes.STRING
            },
            shardId: {
                type: DataTypes.INTEGER
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
