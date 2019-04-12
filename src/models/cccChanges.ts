import * as Sequelize from "sequelize";

export interface CCCChangeAttribute {
    address: string;
    change: string;
    blockNumber: number;
    reason: "fee" | "author" | "stake" | "tx" | "initial_distribution";
    transactionHash?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CCCChangeInstance
    extends Sequelize.Instance<CCCChangeAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const CCCChange = sequelize.define(
        "CCCChange",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.BIGINT
            },
            address: {
                allowNull: false,
                type: DataTypes.STRING
            },
            change: {
                allowNull: false,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            blockNumber: {
                allowNull: false,
                type: DataTypes.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: "Blocks",
                    key: "number"
                }
            },
            reason: {
                allowNull: false,
                type: DataTypes.ENUM(
                    "fee",
                    "author",
                    "stake",
                    "tx",
                    "initial_distribution"
                ),
                validate: {
                    isIn: [
                        ["fee", "author", "stake", "tx", "initial_distribution"]
                    ]
                }
            },
            transactionHash: {
                allowNull: true,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                }
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
    return CCCChange;
};
