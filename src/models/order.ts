import * as Sequelize from "sequelize";
import { AssetOutPointAttribute } from "./assettransferinput";

export interface OrderAttribute {
    id?: string;
    orderHash: string;
    transactionHash: string;

    assetTypeFrom: string;
    assetTypeTo: string;
    assetTypeFee: string;
    shardIdFrom: number;
    shardIdTo: number;
    shardIdFee: number;
    assetQuantityFrom: string;
    assetQuantityTo: string;
    assetQuantityFee: string;

    originOutputs: AssetOutPointAttribute[];
    expiration: string;
    lockScriptHashFrom: string;
    parametersFrom: string[];
    lockScriptHashFee: string;
    parametersFee: string[];
}

export interface OrderInstance extends Sequelize.Instance<OrderAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Order = sequelize.define(
        "Order",
        {
            orderHash: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING
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
            assetTypeFrom: {
                allowNull: false,
                type: DataTypes.STRING
            },
            assetTypeTo: {
                allowNull: false,
                type: DataTypes.STRING
            },
            assetTypeFee: {
                allowNull: false,
                type: DataTypes.STRING
            },
            shardIdFrom: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            shardIdTo: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            shardIdFee: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            assetQuantityFrom: {
                allowNull: false,
                type: DataTypes.STRING
            },
            assetQuantityTo: {
                allowNull: false,
                type: DataTypes.STRING
            },
            assetQuantityFee: {
                allowNull: false,
                type: DataTypes.STRING
            },
            originOutputs: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            expiration: {
                allowNull: false,
                type: DataTypes.STRING
            },
            lockScriptHashFrom: {
                allowNull: false,
                type: DataTypes.STRING
            },
            parametersFrom: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            lockScriptHashFee: {
                allowNull: false,
                type: DataTypes.STRING
            },
            parametersFee: {
                allowNull: false,
                type: DataTypes.JSONB
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
    Order.associate = () => {
        // associations can be defined here
    };
    return Order;
};
