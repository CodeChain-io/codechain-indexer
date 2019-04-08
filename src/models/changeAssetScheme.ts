import * as Sequelize from "sequelize";

export interface ChangeAssetSchemeAttribute {
    transactionHash: string;
    assetType: string;
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    registrar?: string | null;
    allowedScriptHashes: string[];
    approvals: string[];
    seq: number;
}

export interface ChangeAssetSchemeInstance
    extends Sequelize.Instance<ChangeAssetSchemeAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    return sequelize.define(
        "ChangeAssetScheme",
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
            assetType: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{40}$"]
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
                allowNull: false,
                type: DataTypes.JSONB
            },
            seq: {
                allowNull: false,
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
};
