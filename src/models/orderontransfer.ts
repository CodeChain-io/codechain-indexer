import * as Sequelize from "sequelize";
import { OrderAttribute, OrderInstance } from "./order";

export interface OrderOnTransferAttribute {
    id?: string;
    transactionHash: string;
    order?: OrderAttribute;
    spentQuantity: string;
    inputIndices: number[];
    outputIndices: number[];
}

export interface OrderOnTransferInstance
    extends Sequelize.Instance<OrderOnTransferAttribute> {
    getOrder: Sequelize.HasOneGetAssociationMixin<OrderInstance>;
}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const OrderOnTransfer = sequelize.define(
        "OrderOnTransfer",
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
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            spentQuantity: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            inputIndices: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            outputIndices: {
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
    OrderOnTransfer.associate = models => {
        OrderOnTransfer.hasOne(models.Order, {
            foreignKey: "orderHash",
            as: "order",
            onDelete: "CASCADE"
        });
    };
    return OrderOnTransfer;
};
