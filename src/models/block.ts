import * as Sequelize from "sequelize";
import { TransactionAttribute } from "./transaction";

export interface BlockAttribute {
    hash: string;
    parentHash: string;
    timestamp: number;
    number: number;
    author: string;
    extraData: Buffer;
    transactionsRoot: string;
    stateRoot: string;
    invoicesRoot: string;
    score: string;
    seal: Buffer[];
    miningReward: string;
    createdAt?: string;
    updatedAt?: string;
    transactions?: TransactionAttribute[];
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
                primaryKey: true
            },
            parentHash: {
                allowNull: false,
                type: DataTypes.STRING
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
                type: DataTypes.STRING
            },
            stateRoot: {
                allowNull: false,
                type: DataTypes.STRING
            },
            invoicesRoot: {
                allowNull: false,
                type: DataTypes.STRING
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
    };
    return Block;
};
