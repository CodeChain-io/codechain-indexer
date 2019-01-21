import * as Sequelize from "sequelize";

export interface WrapCCCAttribute {
    transactionHash: string;
    shardId: number;
    lockScriptHash: string;
    parameters: string[];
    quantity: string;
    recipient: string;
}

export interface WrapCCCInstance extends Sequelize.Instance<WrapCCCAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    return sequelize.define(
        "WrapCCC",
        {
            transactionHash: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },

            shardId: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            lockScriptHash: {
                allowNull: false,
                type: Sequelize.STRING
            },
            parameters: {
                allowNull: false,
                type: Sequelize.JSONB
            },
            quantity: {
                allowNull: false,
                type: Sequelize.NUMERIC({ precision: 20, scale: 0 })
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
};
