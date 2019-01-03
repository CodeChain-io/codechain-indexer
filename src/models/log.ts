import * as Sequelize from "sequelize";

export interface LogAttribute {
    id: string;
    date: string;
    count: number;
    type: LogType;
    value?: string | null;
}

export enum LogType {
    BLOCK_COUNT = "BLOCK_COUNT",
    BLOCK_MINING_COUNT = "BLOCK_MINING_COUNT",
    PARCEL_COUNT = "PARCEL_COUNT",
    TX_COUNT = "TX_COUNT",
    PARCEL_PAYMENT_COUNT = "PARCEL_PAYMENT_COUNT",
    PARCEL_SET_REGULAR_KEY_COUNT = "PARCEL_SET_REGULAR_KEY_COUNT",
    PARCEL_ASSET_TRANSACTION_COUNT = "PARCEL_ASSET_TRANSACTION_COUNT",
    PARCEL_SET_SHARD_OWNER_COUNT = "PARCEL_SET_SHARD_OWNER_COUNT",
    PARCEL_SET_SHARD_USER_COUNT = "PARCEL_SET_SHARD_USER_COUNT",
    PARCEL_CREATE_SHARD_COUNT = "PARCEL_CREATE_SHARD_COUNT",
    TX_ASSET_MINT_COUNT = "TX_ASSET_MINT_COUNT",
    TX_ASSET_TRANSFER_COUNT = "TX_ASSET_TRANSFER_COUNT",
    TX_ASSET_COMPOSE_COUNT = "TX_ASSET_COMPOSE_COUNT",
    TX_ASSET_DECOMPOSE_COUNT = "TX_ASSET_DECOMPOSE_COUNT"
}

export interface LogInstance extends Sequelize.Instance<LogAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Log = sequelize.define(
        "Log",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING
            },
            date: {
                allowNull: false,
                type: DataTypes.STRING
            },
            count: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            type: {
                allowNull: false,
                type: DataTypes.STRING
            },
            value: {
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
    Log.associate = () => {
        // associations can be defined here
    };
    return Log;
};
