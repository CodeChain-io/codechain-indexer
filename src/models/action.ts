import * as Sequelize from "sequelize";
import { AssetMintOutputAttribute } from "./assetmintoutput";
import { AssetTransferInputAttribute } from "./assettransferinput";
import { AssetTransferOutputAttribute } from "./assettransferoutput";

export type ActionAttribute =
    | MintAssetAttribute
    | TransferAssetAttribute
    | ComposeAssetAttribute
    | DecomposeAssetAttribute
    | PayAttribute
    | SetRegularKeyAttribute
    | CreateShardAttribute
    | SetShardOwnersAttribute
    | SetShardUsersAttribute;

interface ActionCommon {
    id?: number;
}

export interface MintAssetAttribute extends ActionCommon {
    type: "mintAsset";
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    approvals: string[];
    assetName?: string;
    output?: AssetMintOutputAttribute;
}

export interface TransferAssetAttribute extends ActionCommon {
    type: "transferAsset";
    networkId: string;
    approvals: string[];
    inputs?: AssetTransferInputAttribute[];
    burns?: AssetTransferInputAttribute[];
    outputs?: AssetTransferOutputAttribute[];
}

export interface ComposeAssetAttribute extends ActionCommon {
    type: "composeAsset";
    networkId: string;
    shardId: number;
    metadata: string;
    approver?: string | null;
    administrator?: string | null;
    approvals: string[];
    assetName?: string;

    inputs?: AssetTransferInputAttribute[];
    output?: AssetTransferOutputAttribute;
}

export interface DecomposeAssetAttribute extends ActionCommon {
    type: "decomposeAsset";
    networkId: string;
    approvals: string[];

    input?: AssetTransferInputAttribute;
    outputs?: AssetTransferOutputAttribute[];
}

export interface PayAttribute extends ActionCommon {
    type: "pay";
    receiver: string;
    amount: string;
}

export interface SetRegularKeyAttribute extends ActionCommon {
    type: "setRegularKey";
    key: string;
}

export interface CreateShardAttribute extends ActionCommon {
    type: "createShard";
}

export interface SetShardOwnersAttribute extends ActionCommon {
    type: "setShardOwners";
    shardId: number;
    owners: string[];
}

export interface SetShardUsersAttribute extends ActionCommon {
    type: "setShardUsers";
    shardId: number;
    users: string[];
}

export interface ActionInstance extends Sequelize.Instance<ActionAttribute> {}

export default (
    sequelize: Sequelize.Sequelize,
    DataTypes: Sequelize.DataTypes
) => {
    const Action = sequelize.define(
        "Action",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER
            },
            type: {
                allowNull: false,
                type: DataTypes.STRING
            },

            networkId: {
                type: Sequelize.STRING
            },
            shardId: {
                type: Sequelize.INTEGER
            },
            metadata: {
                type: Sequelize.STRING
            },
            approver: {
                type: Sequelize.STRING
            },
            administrator: {
                type: Sequelize.STRING
            },

            approvals: {
                type: Sequelize.JSONB
            },
            assetName: {
                type: Sequelize.STRING
            },

            receiver: {
                type: DataTypes.STRING
            },
            amount: {
                type: DataTypes.NUMERIC({ precision: 20, scale: 0 })
            },

            key: {
                type: DataTypes.STRING
            },

            owners: {
                type: DataTypes.JSONB
            },
            users: {
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
    Action.associate = models => {
        Action.hasMany(models.AssetTransferOutput, {
            foreignKey: "actionId",
            as: "outputs",
            onDelete: "CASCADE"
        });
        Action.hasOne(models.AssetMintOutput, {
            foreignKey: "actionId",
            as: "output",
            onDelete: "CASCADE"
        });
        Action.hasMany(models.AssetTransferInput, {
            foreignKey: "actionId",
            as: "inputs",
            onDelete: "CASCADE"
        });
        Action.hasMany(models.AssetTransferBurn, {
            foreignKey: "actionId",
            as: "burns",
            onDelete: "CASCADE"
        });
        Action.hasOne(models.AssetDecomposeInput, {
            foreignKey: "actionId",
            as: "input",
            onDelete: "CASCADE"
        });
    };
    return Action;
};
