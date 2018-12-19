import * as Sequelize from "sequelize";

export interface ParcelAttribute {
    id?: string;
    blockNumber: number;
    blockHash: string;
    parcelIndex: number;
    seq: number;
    fee: string;
    networkId: string;
    sig: string;
    hash: string;
    signer: string;
    timestamp: number;
    isRetracted: boolean;
}

export interface ParcelInstance extends Sequelize.Instance<ParcelAttribute> {}

export default (sequelize: Sequelize.Sequelize, DataTypes: Sequelize.DataTypes) => {
    const Parcel = sequelize.define(
        "Parcel",
        {
            hash: {
                primaryKey: true,
                allowNull: false,
                type: DataTypes.STRING
            },
            blockNumber: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            blockHash: {
                allowNull: false,
                type: DataTypes.STRING
            },
            parcelIndex: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            seq: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            fee: {
                allowNull: false,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            networkId: {
                allowNull: false,
                type: DataTypes.STRING
            },
            sig: {
                allowNull: false,
                type: DataTypes.STRING
            },
            signer: {
                allowNull: false,
                type: DataTypes.STRING
            },
            timestamp: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            isRetracted: {
                allowNull: false,
                type: DataTypes.BOOLEAN
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
    Parcel.associate = models => {
        Parcel.hasOne(models.Action, {
            foreignKey: "parcelHash",
            as: "action"
        });
    };
    return Parcel;
};
