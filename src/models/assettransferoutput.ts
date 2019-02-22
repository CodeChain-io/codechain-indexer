import * as Sequelize from "sequelize";

export interface AssetTransferOutputAttribute {
    id?: string;
    transactionHash: string;
    lockScriptHash: string;
    parameters: string[];
    assetType: string;
    shardId: number;
    quantity: string;
    owner?: string | null;
}

export interface AssetTransferOutputInstance
    extends Sequelize.Instance<AssetTransferOutputAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AssetTransferOutput = sequelize.define(
        "AssetTransferOutput",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.BIGINT
            },
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
            assetType: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{40}$"]
                }
            },
            shardId: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            quantity: {
                allowNull: false,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            owner: {
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
    AssetTransferOutput.associate = models => {
        AssetTransferOutput.belongsTo(models.AssetScheme, {
            foreignKey: "assetType",
            as: "assetScheme"
        });
        // associations can be defined here
    };
    return AssetTransferOutput;
};
