import * as Sequelize from "sequelize";

export interface BlockAttribute {
    hash: string;
    parentHash: string;
    timestamp: number;
    number: number;
    author: string;
    extraData: Buffer;
    transactionsRoot: string;
    stateRoot: string;
    score: string;
    seal: Buffer[];
    miningReward: string;
    transactionsCount: number;
    transactionsCountByType: {
        [type: string]: number;
    };
    size: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface BlockInstance extends Sequelize.Instance<BlockAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Block = sequelize.define(
        "Block",
        {
            hash: {
                allowNull: false,
                type: DataTypes.STRING,
                primaryKey: true,
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                }
            },
            parentHash: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                }
            },
            timestamp: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            number: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            author: {
                allowNull: false,
                type: DataTypes.STRING
            },
            extraData: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            transactionsRoot: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                }
            },
            stateRoot: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                }
            },
            score: {
                allowNull: false,
                type: DataTypes.STRING
            },
            seal: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            miningReward: {
                allowNull: false,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            transactionsCount: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            transactionsCountByType: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            size: {
                allowNull: false,
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
    Block.associate = models => {
        Block.hasMany(models.Transaction, {
            foreignKey: "blockHash",
            as: "transactions",
            onDelete: "CASCADE"
        });
        Block.hasMany(models.CCCChange, {
            sourceKey: "number",
            foreignKey: "blockNumber",
            as: "changes",
            onDelete: "CASCADE"
        });
    };
    return Block;
};
