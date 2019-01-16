import * as Sequelize from "sequelize";

export interface CustomAttribute {
    transactionHash: string;
    handlerId: number;
    content: string;
}

export interface CustomInstance extends Sequelize.Instance<CustomAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    return sequelize.define(
        "Custom",
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

            handlerId: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            content: {
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
