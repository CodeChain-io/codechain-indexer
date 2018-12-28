import * as Sequelize from "sequelize";

export interface SnapshotRequestAttribute {
    id?: string;
    timestamp: number;
    assetType: string;
    status: "wait" | "done";
}

export interface SnapshotRequestInstance
    extends Sequelize.Instance<SnapshotRequestAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const SnapshotRequest = sequelize.define(
        "SnapshotRequest",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.BIGINT
            },
            timestamp: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            assetType: {
                allowNull: false,
                type: DataTypes.STRING
            },
            status: {
                allowNull: false,
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
    SnapshotRequest.associate = () => {
        // associations can be defined here
    };
    return SnapshotRequest;
};
