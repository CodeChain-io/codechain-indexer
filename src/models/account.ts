import * as Sequelize from "sequelize";

export interface AccountAttribtue {
    address: string;
    balance: string;
    seq: number;
}

export interface AccountInstance extends Sequelize.Instance<AccountAttribtue> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Account = sequelize.define(
        "Account",
        {
            address: {
                primaryKey: true,
                type: DataTypes.STRING
            },
            balance: {
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            seq: {
                type: DataTypes.INTEGER
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
    Account.associate = () => {
        // associations can be defined here
    };
    return Account;
};
