import * as Sequelize from "sequelize";
import { UTXOAttribute } from "./utxo";

export interface UTXOSnapshotAttribute {
    snapshotId: string;
    blockNumber: number;
    snapshot: UTXOAttribute[];
}

export interface UTXOSnapshotInstance
    extends Sequelize.Instance<UTXOSnapshotAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const UTXOSnapshot = sequelize.define(
        "UTXOSnapshot",
        {
            snapshotId: {
                allowNull: false,
                type: DataTypes.BIGINT,
                primaryKey: true,
                onDelete: "CASCADE",
                references: {
                    model: "SnapshotRequests",
                    key: "id"
                }
            },
            blockNumber: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            snapshot: {
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
    UTXOSnapshot.associate = () => {
        // associations can be defined here
    };
    return UTXOSnapshot;
};
