import * as Sequelize from "sequelize";

export type ActionAttribute =
    | AssetTransaction
    | PaymentAttribute
    | SetRegularKeyAttribute
    | CreateShardAttribute
    | SetShardOwnersAttribute
    | SetShardUsersAttribute;

export interface AssetTransaction {
    action: "assetTransaction";
    parcelHash: string;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface PaymentAttribute {
    action: "payment";
    parcelHash: string;
    receiver: string;
    amount: string;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface SetRegularKeyAttribute {
    action: "setRegularKey";
    parcelHash: string;
    key: string;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface CreateShardAttribute {
    action: "createShard";
    parcelHash: string;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface SetShardOwnersAttribute {
    action: "setShardOwners";
    parcelHash: string;
    shardId: number;
    owners: string[];
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface SetShardUsersAttribute {
    action: "setShardUsers";
    parcelHash: string;
    shardId: number;
    users: string[];
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface ActionInstance extends Sequelize.Instance<ActionAttribute> {}

export default (sequelize: Sequelize.Sequelize, DataTypes: Sequelize.DataTypes) => {
    const Action = sequelize.define(
        "Action",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER
            },
            parcelHash: {
                allowNull: false,
                type: DataTypes.STRING,
                references: {
                    model: "Parcels",
                    key: "hash"
                }
            },
            action: {
                allowNull: false,
                type: DataTypes.STRING
            },
            receiver: {
                type: DataTypes.STRING
            },
            key: {
                type: DataTypes.STRING
            },
            amount: {
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            shardId: {
                type: DataTypes.INTEGER
            },
            invoice: {
                type: DataTypes.BOOLEAN
            },
            owners: {
                type: DataTypes.JSONB
            },
            users: {
                type: DataTypes.JSONB
            },
            errorType: {
                type: DataTypes.STRING
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
    Action.associate = () => {
        // associations can be defined here
    };
    return Action;
};
