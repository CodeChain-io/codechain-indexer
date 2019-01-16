import * as Sequelize from "sequelize";
import { ComposeAssetAttribute, ComposeAssetInstance } from "./composeAsset";
import { CreateShardAttribute, CreateShardInstance } from "./createShard";
import { CustomAttribute, CustomInstance } from "./custom";
import {
    DecomposeAssetAttribute,
    DecomposeAssetInstance
} from "./decomposeAsset";
import { MintAssetAttribute, MintAssetInstance } from "./mintAsset";
import { PayAttribute, PayInstance } from "./pay";
import { RemoveAttribute, RemoveInstance } from "./remove";
import { SetRegularKeyAttribute, SetRegularKeyInstance } from "./setRegularKey";
import {
    SetShardOwnersAttribute,
    SetShardOwnersInstance
} from "./setShardOwners";
import { SetShardUsersAttribute, SetShardUsersInstance } from "./setShardUsers";
import { StoreAttribute, StoreInstance } from "./store";
import { TransferAssetAttribute, TransferAssetInstance } from "./transferAsset";

export interface TransactionAttribute {
    hash: string;
    blockNumber?: number | null;
    blockHash?: string | null;
    transactionIndex?: number | null;
    type?: string;
    pay?: PayAttribute;
    mintAsset?: MintAssetAttribute;
    transferAsset?: TransferAssetAttribute;
    composeAsset?: ComposeAssetAttribute;
    decomposeAsset?: DecomposeAssetAttribute;
    setRegularKey?: SetRegularKeyAttribute;
    createShard?: CreateShardAttribute;
    setShardOwners?: SetShardOwnersAttribute;
    setShardUses?: SetShardUsersAttribute;
    store?: StoreAttribute;
    remove?: RemoveAttribute;
    custom?: CustomAttribute;
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
    getMintAsset: Sequelize.HasOneGetAssociationMixin<MintAssetInstance>;
    getTransferAsset: Sequelize.HasOneGetAssociationMixin<
        TransferAssetInstance
    >;
    getComposeAsset: Sequelize.HasOneGetAssociationMixin<ComposeAssetInstance>;
    getDecomposeAsset: Sequelize.HasOneGetAssociationMixin<
        DecomposeAssetInstance
    >;
    getPay: Sequelize.HasOneGetAssociationMixin<PayInstance>;
    getSetRegularKey: Sequelize.HasOneGetAssociationMixin<
        SetRegularKeyInstance
    >;
    getCreateShard: Sequelize.HasOneGetAssociationMixin<CreateShardInstance>;
    getSetShardOwners: Sequelize.HasOneGetAssociationMixin<
        SetShardOwnersInstance
    >;
    getSetShardUsers: Sequelize.HasOneGetAssociationMixin<
        SetShardUsersInstance
    >;
    getStore: Sequelize.HasOneGetAssociationMixin<StoreInstance>;
    getRemove: Sequelize.HasOneGetAssociationMixin<RemoveInstance>;
    getCustom: Sequelize.HasOneGetAssociationMixin<CustomInstance>;
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
        Transaction.hasOne(models.MintAsset, {
            foreignKey: "transactionHash",
            as: "mintAsset",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.TransferAsset, {
            foreignKey: "transactionHash",
            as: "transferAsset",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.ComposeAsset, {
            foreignKey: "transactionHash",
            as: "composeAsset",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.DecomposeAsset, {
            foreignKey: "transactionHash",
            as: "decomposeAsset",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.Pay, {
            foreignKey: "transactionHash",
            as: "pay",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.SetRegularKey, {
            foreignKey: "transactionHash",
            as: "setRegularKey",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.CreateShard, {
            foreignKey: "transactionHash",
            as: "createShard",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.SetShardOwners, {
            foreignKey: "transactionHash",
            as: "setShardOwners",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.SetShardUsers, {
            foreignKey: "transactionHash",
            as: "setShardUsers",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.Store, {
            foreignKey: "transactionHash",
            as: "store",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.Remove, {
            foreignKey: "transactionHash",
            as: "remove",
            onDelete: "CASCADE"
        });
        Transaction.hasOne(models.Custom, {
            foreignKey: "transactionHash",
            as: "custom",
            onDelete: "CASCADE"
        });
    };
    return Transaction;
};
