import * as Sequelize from "sequelize";

export interface CreateShardAttribute {
    transactionHash: string;
    shardId?: number;
}

export interface CreateShardInstance
    extends Sequelize.Instance<CreateShardAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    return sequelize.define(
        "CreateShard",
        {
            transactionHash: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Transactions",
                    key: "hash"
                },
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                }
            },

            shardId: {
                type: DataTypes.INTEGER
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
