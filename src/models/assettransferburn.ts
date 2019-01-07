import * as Sequelize from "sequelize";
import { AssetTransferInputAttribute } from "./assettransferinput";

export interface AssetTransferBurnInstance
    extends Sequelize.Instance<AssetTransferInputAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AssetTransferBurn = sequelize.define(
        "AssetTransferBurn",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.BIGINT
            },
            actionId: {
                allowNull: false,
                type: DataTypes.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: "Actions",
                    key: "id"
                }
            },
            prevOut: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            timelock: {
                type: DataTypes.JSONB
            },
            lockScript: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            unlockScript: {
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
    AssetTransferBurn.associate = () => {
        // associations can be defined here
    };
    return AssetTransferBurn;
};
