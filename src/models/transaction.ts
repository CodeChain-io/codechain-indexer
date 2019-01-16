import * as Sequelize from "sequelize";
import { ActionAttribute, ActionInstance } from "./action";

export interface TransactionAttribute {
    hash: string;
    blockNumber?: number | null;
    blockHash?: string | null;
    transactionIndex?: number | null;
    type?: string;
    actionId?: number;
    action?: ActionAttribute;
    seq: number;
    fee: string;
    networkId: string;
    sig: string;
    signer: string;
    invoice?: boolean | null;
    errorType?: string | null;
    timestamp?: number | null;
    isPending: boolean;
    pendingTimestamp?: number | null;
}

export interface TransactionInstance
    extends Sequelize.Instance<TransactionAttribute> {
    getAction: Sequelize.BelongsToGetAssociationMixin<ActionInstance>;
}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Transaction = sequelize.define(
        "Transaction",
        {
            hash: {
                primaryKey: true,
                allowNull: false,
                type: DataTypes.STRING
            },
            blockNumber: {
                type: DataTypes.INTEGER
            },
            blockHash: {
                type: DataTypes.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Blocks",
                    key: "hash"
                }
            },
            transactionIndex: {
                type: DataTypes.INTEGER
            },
            type: {
                allowNull: false,
                type: Sequelize.STRING
            },
            actionId: {
                allowNull: false,
                type: Sequelize.STRING,
                onDelete: "CASCADE",
                references: {
                    model: "Actions",
                    key: "id"
                }
            },
            seq: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            fee: {
                allowNull: false,
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },
            networkId: {
                allowNull: false,
                type: DataTypes.STRING
            },
            sig: {
                allowNull: false,
                type: DataTypes.STRING
            },
            signer: {
                allowNull: false,
                type: DataTypes.STRING
            },

            invoice: {
                type: Sequelize.BOOLEAN
            },
            errorType: {
                type: Sequelize.STRING
            },
            timestamp: {
                type: DataTypes.INTEGER
            },
            isPending: {
                allowNull: false,
                type: DataTypes.BOOLEAN
            },
            pendingTimestamp: {
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
    Transaction.associate = models => {
        Transaction.belongsTo(models.Action, {
            foreignKey: "actionId",
            as: "action"
        });
    };
    return Transaction;
};
