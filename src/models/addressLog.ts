import * as Sequelize from "sequelize";

export type AddressLogType =
    | "TransactionSigner"
    | "TransactionApprover"
    | "AssetOwner"
    | "Approver"
    | "Registrar";

export interface AddressLogAttribute {
    id?: number;
    transactionHash: string;
    transactionTracker?: string | null;
    transactionType: string | null;
    blockNumber?: number | null;
    transactionIndex?: number | null;
    success?: boolean | null;
    isPending: boolean;
    address: string;
    // NOTE: It can be removed it's not used for the API.
    type: AddressLogType;
}

export type AddressLogInstance = Sequelize.Instance<AddressLogAttribute>;

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const AddressLog = sequelize.define(
        "AddressLog",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.BIGINT
            },
            transactionHash: {
                allowNull: false,
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                },
                references: {
                    model: "Transactions",
                    key: "hash"
                }
            },
            transactionType: {
                allowNull: false,
                type: DataTypes.STRING
            },
            transactionTracker: {
                type: DataTypes.STRING,
                validate: {
                    is: ["^[a-f0-9]{64}$"]
                }
            },
            blockNumber: {
                type: DataTypes.INTEGER
            },
            transactionIndex: {
                type: DataTypes.INTEGER
            },
            success: {
                type: DataTypes.BOOLEAN
            },
            isPending: {
                allowNull: false,
                type: DataTypes.BOOLEAN
            },
            address: {
                allowNull: false,
                type: DataTypes.STRING
            },
            type: {
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
    AddressLog.associate = () => {
        // associations can be defined here
    };
    return AddressLog;
};
