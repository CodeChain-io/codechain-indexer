import * as Sequelize from "sequelize";

export interface AssetImageAttribute {
    assetType: string;
    image: string;
}

export interface AssetImageInstance
    extends Sequelize.Instance<AssetImageAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AssetImage = sequelize.define(
        "AssetImage",
        {
            assetType: {
                primaryKey: true,
                allowNull: false,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "AssetSchemes",
                    key: "assetType"
                }
            },
            image: {
                allowNull: false,
                type: DataTypes.BLOB
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
    AssetImage.associate = () => {
        // associations can be defined here
    };
    return AssetImage;
};
