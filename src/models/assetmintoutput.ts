import * as Sequelize from "sequelize";

export interface AssetMintOutputAttribute {
    id?: string;
    transactionHash: string;
    lockScriptHash: string;
    parameters: Buffer[];
    amount?: string | null;
    approver?: string | null;
    administrator?: string | null;
    assetType: string;
}

export interface AssetMintOutputInstance
    extends Sequelize.Instance<AssetMintOutputAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AssetMintOutput = sequelize.define(
        "AssetMintOutput",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER
            },
            transactionHash: {
                allowNull: false,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            lockScriptHash: {
                type: DataTypes.STRING
            },
            parameters: {
                type: DataTypes.JSONB
            },
            amount: {
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            approver: {
                type: DataTypes.STRING
            },
            administrator: {
                type: DataTypes.STRING
            },
            assetType: {
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
    AssetMintOutput.associate = () => {
        // associations can be defined here
    };
    return AssetMintOutput;
};
