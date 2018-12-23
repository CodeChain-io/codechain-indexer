import * as Sequelize from "sequelize";
import { AssetTransferInputAttribute } from "./transaction";

export interface AssetDecomposeInputInstance
    extends Sequelize.Instance<AssetTransferInputAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AssetDecomposeInput = sequelize.define(
        "AssetDecomposeInput",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.BIGINT
            },
            transactionHash: {
                allowNull: false,
                type: DataTypes.STRING
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
    AssetDecomposeInput.associate = () => {
        // associations can be defined here
    };
    return AssetDecomposeInput;
};
