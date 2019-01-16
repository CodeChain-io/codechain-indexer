import * as Sequelize from "sequelize";

export interface SetShardOwnersAttribute {
    transactionHash: string;
    shardId: number;
    owners: string[];
}

export interface SetShardOwnersInstance
    extends Sequelize.Instance<SetShardOwnersAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    return sequelize.define(
        "SetShardOwners",
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
            owners: {
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
