import * as Sequelize from "sequelize";

export interface ParcelAttribute {
    id?: string;
    blockNumber?: number | null;
    blockHash?: string | null;
    parcelIndex?: number | null;
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
                type: Sequelize.INTEGER
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
    Parcel.associate = () => {
        // associate
    };
    return Parcel;
};
