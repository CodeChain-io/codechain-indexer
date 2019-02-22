import * as Sequelize from "sequelize";

export interface SetShardUsersAttribute {
    transactionHash: string;
    shardId: number;
    users: string[];
}

export interface SetShardUsersInstance
    extends Sequelize.Instance<SetShardUsersAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    return sequelize.define(
        "SetShardUsers",
        {
            transactionHash: {
                allowNull: false,
                primaryKey: true,
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

            shardId: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            users: {
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
};
