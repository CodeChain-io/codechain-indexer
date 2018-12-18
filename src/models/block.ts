import { BlockDoc } from "codechain-indexer-types";
import * as Sequelize from "sequelize";

export interface BlockInstance extends Sequelize.Instance<BlockDoc> {}

export default (sequelize: Sequelize.Sequelize, DataTypes: Sequelize.DataTypes) => {
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
            parcelsRoot: {
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
            isRetracted: {
                allowNull: false,
                type: DataTypes.BOOLEAN
            },
            miningReward: {
                allowNull: false,
                type: DataTypes.STRING
            }
        },
        {}
    );
    Block.associate = () => {
        // associations can be defined here
    };
    return Block;
};
