import * as Sequelize from "sequelize";

export interface AssetTypeLogAttribute {
    id?: number;
    transactionHash: string;
    transactionTracker?: string | null;
    transactionType: string | null;
    blockNumber?: number | null;
    transactionIndex?: number | null;
    success?: boolean | null;
    isPending: boolean;
    assetType: string;
}

export type AssetTypeLogInstance = Sequelize.Instance<AssetTypeLogAttribute>;

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AssetTypeLog = sequelize.define(
        "AssetTypeLog",
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
            transactionType: {
                allowNull: false,
                type: DataTypes.STRING
            },
            transactionTracker: {
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                }
            },
            blockNumber: {
                type: DataTypes.INTEGER
            },
            transactionIndex: {
                type: DataTypes.INTEGER
            },
            success: {
                type: DataTypes.BOOLEAN
            },
            isPending: {
                allowNull: false,
                type: DataTypes.BOOLEAN
            },
            assetType: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{40}$"]
                }
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
    AssetTypeLog.associate = () => {
        // associations can be defined here
    };
    return AssetTypeLog;
};
