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
    TX_COUNT = "TX_COUNT",
    PAY_COUNT = "PAY_COUNT",
    SET_REGULAR_KEY_COUNT = "SET_REGULAR_KEY_COUNT",
    SET_SHARD_OWNER_COUNT = "SET_SHARD_OWNER_COUNT",
    SET_SHARD_USER_COUNT = "SET_SHARD_USER_COUNT",
    CREATE_SHARD_COUNT = "CREATE_SHARD_COUNT",
    MINT_ASSET_COUNT = "MINT_ASSET_COUNT",
    TRANSFER_ASSET_COUNT = "TRANSFER_ASSET_COUNT",
    COMPOSE_ASSET_COUNT = "COMPOSE_ASSET_COUNT",
    DECOMPOSE_ASSET_COUNT = "DECOMPOSE_ASSET_COUNT",
    CHANGE_ASSET_SCHEME_COUNT = "CHANGE_ASSET_SCHEME_COUNT",
    INCREASE_ASSET_SUPPLY_COUNT = "INCREASE_ASSET_SUPPLY_COUNT",
    STORE_COUNT = "STORE_COUNT",
    REMOVE_COUNT = "REMOVE_COUNT",
    CUSTOM_COUNT = "CUSTOM_COUNT",
    UNWRAP_CCC_COUNT = "UNWRAP_CCC_COUNT",
    WRAP_CCC_COUNT = "WRAP_CCC_COUNT"
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
