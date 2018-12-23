import * as Sequelize from "sequelize";
import { AssetSchemeAttribute } from "./assetscheme";

export interface UTXOAttribute {
    id?: string;
    address: string;
    assetType: string;
    lockScriptHash: string;
    parameters: Buffer[];
    amount: string;
    transactionHash: string;
    transactionOutputIndex: number;
    isUsed: boolean;
    assetScheme?: AssetSchemeAttribute;
}

export interface UTXOInstance extends Sequelize.Instance<UTXOAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const UTXO = sequelize.define(
        "UTXO",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.BIGINT
            },
            address: {
                allowNull: false,
                type: DataTypes.STRING
            },
            quantity: {
                allowNull: false,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            asset: {
                allowNull: false,
                type: DataTypes.JSONB
            },
            isUsed: {
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
    UTXO.associate = () => {
        // associations can be defined here
    };
    return UTXO;
};
