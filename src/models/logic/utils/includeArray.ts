import models from "../..";

export const includeArray = [
    {
        attributes: [],
        as: "mintAsset",
        model: models.MintAsset
    },
    {
        attributes: [],
        as: "transferAsset",
        model: models.TransferAsset,
        include: [
            {
                attributes: [],
                as: "outputs",
                model: models.AssetTransferOutput,
                include: [
                    {
                        attributes: [],
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                attributes: [],
                as: "inputs",
                model: models.AssetTransferInput,
                include: [
                    {
                        attributes: [],
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                attributes: [],
                as: "burns",
                model: models.AssetTransferBurn,
                include: [
                    {
                        attributes: [],
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                attributes: [],
                as: "orders",
                model: models.OrderOnTransfer
            }
        ]
    },
    {
        attributes: [],
        as: "composeAsset",
        model: models.ComposeAsset,
        include: [
            {
                attributes: [],
                as: "inputs",
                model: models.AssetTransferInput
            }
        ]
    },
    {
        attributes: [],
        as: "decomposeAsset",
        model: models.DecomposeAsset,
        include: [
            {
                attributes: [],
                as: "input",
                model: models.AssetTransferInput
            },
            {
                attributes: [],
                as: "outputs",
                model: models.AssetTransferOutput
            }
        ]
    },
    {
        attributes: [],
        as: "changeAssetScheme",
        model: models.ChangeAssetScheme
    },
    {
        attributes: [],
        as: "increaseAssetSupply",
        model: models.IncreaseAssetSupply
    },
    {
        attributes: [],
        as: "wrapCCC",
        model: models.WrapCCC
    },
    {
        attributes: [],
        as: "unwrapCCC",
        model: models.UnwrapCCC,
        include: [
            {
                attributes: [],
                as: "burn",
                model: models.AssetTransferBurn
            }
        ]
    },
    {
        attributes: [],
        as: "pay",
        model: models.Pay
    },
    {
        attributes: [],
        as: "setRegularKey",
        model: models.SetRegularKey
    },
    {
        attributes: [],
        as: "createShard",
        model: models.CreateShard
    },
    {
        attributes: [],
        as: "setShardOwners",
        model: models.SetShardOwners
    },
    {
        attributes: [],
        as: "setShardUsers",
        model: models.SetShardUsers
    },
    {
        attributes: [],
        as: "store",
        model: models.Store
    },
    {
        attributes: [],
        as: "remove",
        model: models.Remove
    },
    {
        attributes: [],
        as: "custom",
        model: models.Custom
    }
];

export const fullIncludeArray = [
    {
        as: "mintAsset",
        model: models.MintAsset
    },
    {
        as: "transferAsset",
        model: models.TransferAsset,
        include: [
            {
                as: "outputs",
                model: models.AssetTransferOutput,
                include: [
                    {
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                as: "inputs",
                model: models.AssetTransferInput,
                include: [
                    {
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                as: "burns",
                model: models.AssetTransferBurn,
                include: [
                    {
                        as: "assetScheme",
                        model: models.AssetScheme
                    }
                ]
            },
            {
                as: "orders",
                model: models.OrderOnTransfer
            }
        ]
    },
    {
        as: "composeAsset",
        model: models.ComposeAsset,
        include: [
            {
                as: "inputs",
                model: models.AssetTransferInput
            }
        ]
    },
    {
        as: "decomposeAsset",
        model: models.DecomposeAsset,
        include: [
            {
                as: "input",
                model: models.AssetTransferInput
            },
            {
                as: "outputs",
                model: models.AssetTransferOutput
            }
        ]
    },
    {
        as: "changeAssetScheme",
        model: models.ChangeAssetScheme
    },
    {
        as: "increaseAssetSupply",
        model: models.IncreaseAssetSupply
    },
    {
        as: "wrapCCC",
        model: models.WrapCCC
    },
    {
        as: "unwrapCCC",
        model: models.UnwrapCCC,
        include: [
            {
                as: "burn",
                model: models.AssetTransferBurn
            }
        ]
    },
    {
        as: "pay",
        model: models.Pay
    },
    {
        as: "setRegularKey",
        model: models.SetRegularKey
    },
    {
        as: "createShard",
        model: models.CreateShard
    },
    {
        as: "setShardOwners",
        model: models.SetShardOwners
    },
    {
        as: "setShardUsers",
        model: models.SetShardUsers
    },
    {
        as: "store",
        model: models.Store
    },
    {
        as: "remove",
        model: models.Remove
    },
    {
        as: "custom",
        model: models.Custom
    }
];
