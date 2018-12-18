import { ParcelDoc } from "codechain-indexer-types";
import * as Sequelize from "sequelize";

export interface ParcelInstance extends Sequelize.Instance<ParcelDoc> {}

export default (sequelize: Sequelize.Sequelize, DataTypes: Sequelize.DataTypes) => {
    const Parcel = sequelize.define(
        "Parcel",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            blockNumber: {
                type: Sequelize.INTEGER
            },
            blockHash: {
                type: Sequelize.STRING
            },
            parcelIndex: {
                type: Sequelize.INTEGER
            },
            seq: {
                allowNull: false,
                type: Sequelize.STRING
            },
            fee: {
                allowNull: false,
                type: Sequelize.STRING
            },
            networkId: {
                allowNull: false,
                type: Sequelize.STRING
            },
            sig: {
                allowNull: false,
                type: Sequelize.STRING
            },
            hash: {
                allowNull: false,
                type: Sequelize.STRING
            },
            signer: {
                allowNull: false,
                type: Sequelize.STRING
            },
            timestamp: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            isRetracted: {
                allowNull: false,
                type: Sequelize.BOOLEAN
            }
        },
        {}
    );
    Parcel.associate = models => {
        models.Block.hasMany(models.Parcel, {
            as: "parcel",
            foreignKey: "hash"
        });
    };
    return Parcel;
};
