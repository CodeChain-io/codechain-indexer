import * as Sequelize from "sequelize";

export type TransactionAttribute =
    | AssetMintTransactionAttribute
    | AssetTransferTransactionAttribute
    | AssetComposeTransactionAttribute
    | AssetDecomposeTransactionAttribute;

export interface AssetMintTransactionAttribute {
    type: "assetMint";
    actionId: string;
    // output?: AssetMintOutputDoc;
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    hash: string;
    timestamp: number;
    assetName?: string | null;
    parcelHash: string;
    blockNumber: number;
    parcelIndex: number;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface AssetTransferTransactionAttribute {
    type: "assetTransfer";
    actionId: string;
    networkId: string;
    // burns: AssetTransferInputDoc[];
    // inputs: AssetTransferInputDoc[];
    // outputs: AssetTransferOutputDoc[];
    hash: string;
    timestamp: number;
    parcelHash: string;
    blockNumber: number;
    parcelIndex: number;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface AssetComposeTransactionAttribute {
    type: "assetCompose";
    actionId: string;
    networkId: string;
    shardId: number;
    metadata: string;
    // output: AssetMintOutputDoc;
    // inputs: AssetTransferInputDoc[];
    hash: string;
    timestamp: number;
    assetName?: string | null;
    parcelHash: string;
    blockNumber: number;
    parcelIndex: number;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface AssetDecomposeTransactionAttribute {
    type: "assetDecompose";
    actionId: string;
    // input: AssetTransferInputDoc;
    // outputs: AssetTransferOutputDoc[];
    networkId: string;
    hash: string;
    timestamp: number;
    parcelHash: string;
    blockNumber: number;
    parcelIndex: number;
    invoice?: boolean | null;
    errorType?: string | null;
}

export interface TransactionInstance
    extends Sequelize.Instance<TransactionAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Transaction = sequelize.define(
        "Transaction",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.BIGINT
            },
            actionId: {
                allowNull: false,
                type: DataTypes.BIGINT,
                onDelete: "CASCADE",
                references: {
                    model: "Actions",
                    key: "id"
                }
            },
            networkId: {
                type: DataTypes.STRING
            },
            shardId: {
                type: DataTypes.INTEGER
            },
            metadata: {
                type: DataTypes.STRING
            },
            approver: {
                type: DataTypes.STRING
            },
            administrator: {
                type: DataTypes.STRING
            },
            hash: {
                allowNull: false,
                type: DataTypes.STRING
            },
            timestamp: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            assetName: {
                type: DataTypes.STRING
            },
            parcelHash: {
                allowNull: false,
                type: DataTypes.STRING
            },
            blockNumber: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            parcelIndex: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            invoice: {
                type: DataTypes.BOOLEAN
            },
            errorType: {
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
    Transaction.associate = () => {
        // associations can be defined here
    };
    return Transaction;
};
