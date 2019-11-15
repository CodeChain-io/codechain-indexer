import * as Sequelize from "sequelize";

export interface AggsUTXOAttribute {
    id?: string;
    address: string;
    assetType: string;
    totalAssetQuantity: string;
    utxoQuantity: string;
}

export interface AggsUTXOInstance
    extends Sequelize.Instance<AggsUTXOAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AggsUTXO = sequelize.define(
        "AggsUTXO",
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
            assetType: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{40}$"]
                }
            },
            totalAssetQuantity: {
                allowNull: false,
                type: DataTypes.BIGINT
            },
            utxoQuantity: {
                allowNull: false,
                type: DataTypes.BIGINT
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

    AggsUTXO.associate = models => {
        AggsUTXO.belongsTo(models.AssetScheme, {
            foreignKey: "assetType",
            as: "assetScheme",
            onDelete: "CASCADE"
        });
    };

    return AggsUTXO;
};
