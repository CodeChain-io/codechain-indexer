import * as Sequelize from "sequelize";

export interface AssetSchemeAttribute {
    assetType: string;
    transactionHash: string;
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
            assetType: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING
            },
            transactionHash: {
                allowNull: false,
                type: DataTypes.STRING
            },
            metadata: {
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
