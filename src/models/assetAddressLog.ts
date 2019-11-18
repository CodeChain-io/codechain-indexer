import * as Sequelize from "sequelize";

export interface AssetAddressLogAttribute {
    id?: number;
    transactionHash: string;
    transactionTracker: string;
    transactionType: string;
    blockNumber?: number | null;
    transactionIndex?: number | null;
    isPending: boolean;
    address: string;
    assetType: string;
}

export type AssetAddressLogInstance = Sequelize.Instance<
    AssetAddressLogAttribute
>;

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AssetAddressLog = sequelize.define(
        "AssetAddressLog",
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
            transactionTracker: {
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                }
            },
            transactionType: {
                allowNull: false,
                type: DataTypes.STRING
            },
            blockNumber: {
                type: DataTypes.INTEGER
            },
            transactionIndex: {
                type: DataTypes.INTEGER
            },
            isPending: {
                allowNull: false,
                type: DataTypes.BOOLEAN
            },
            address: {
                allowNull: false,
                type: DataTypes.STRING
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
    AssetAddressLog.associate = () => {
        // associations can be defined here
    };
    return AssetAddressLog;
};
