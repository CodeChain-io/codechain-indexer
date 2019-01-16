import * as Sequelize from "sequelize";

export interface StoreAttribute {
    transactionHash: string;
    content: string;
    certifier: string;
    signature: string;
}

export interface StoreInstance extends Sequelize.Instance<StoreAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    return sequelize.define(
        "Store",
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

            content: {
                allowNull: false,
                type: DataTypes.STRING
            },
            certifier: {
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
