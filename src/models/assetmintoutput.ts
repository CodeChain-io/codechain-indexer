import * as Sequelize from "sequelize";

export interface AssetMintOutputAttribute {
    id?: number;
    actionId: number;
    lockScriptHash: string;
    parameters: Buffer[];
    amount: string;
    approver?: string | null;
    administrator?: string | null;
    assetType: string;
    recipient: string;
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
                type: DataTypes.BIGINT
            },
            actionId: {
                allowNull: false,
                type: DataTypes.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: "Actions",
                    key: "id"
                }
            },
            lockScriptHash: {
                allowNull: false,
                type: DataTypes.STRING
            },
            parameters: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            amount: {
                allowNull: false,
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
    AssetMintOutput.associate = () => {
        // associations can be defined here
    };
    return AssetMintOutput;
};
