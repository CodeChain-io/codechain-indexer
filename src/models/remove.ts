import * as Sequelize from "sequelize";

export interface RemoveAttribute {
    transactionHash: string;
    textHash: string;
    signature: string;
}

export interface RemoveInstance extends Sequelize.Instance<RemoveAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    return sequelize.define(
        "Remove",
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

            textHash: {
                allowNull: false,
                type: DataTypes.STRING
            },
            signature: {
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
