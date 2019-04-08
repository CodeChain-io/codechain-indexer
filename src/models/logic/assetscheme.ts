import { H160, PlatformAddress, U64 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { AssetSchemeInstance } from "../assetscheme";
import models from "../index";
import { TransactionInstance } from "../transaction";
import * as AssetImageModel from "./assetimage";
import { strip0xPrefix } from "./utils/format";

export async function createAssetScheme(
    assetType: string,
    transactionHash: string,
    assetScheme: {
        metadata: string;
        approver: PlatformAddress | null;
        registrar: PlatformAddress | null;
        allowedScriptHashes: H160[];
        supply: U64;
        networkId: string;
        shardId: number;
        seq: number;
    }
): Promise<AssetSchemeInstance> {
    let assetSchemeInstance: AssetSchemeInstance;
    try {
        assetSchemeInstance = await models.AssetScheme.create({
            transactionHash: strip0xPrefix(transactionHash),
            assetType: strip0xPrefix(assetType),
            metadata: assetScheme.metadata,
            approver: assetScheme.approver && assetScheme.approver.value,
            registrar: assetScheme.registrar && assetScheme.registrar.value,
            allowedScriptHashes: assetScheme.allowedScriptHashes.map(hash =>
                strip0xPrefix(hash.value)
            ),
            supply: assetScheme.supply.value.toString(10),
            networkId: assetScheme.networkId,
            shardId: assetScheme.shardId,
            seq: assetScheme.seq
        });

        let metadataObj;
        try {
            metadataObj = JSON.parse(assetScheme.metadata);
        } catch (e) {
            //
        }
        if (metadataObj && metadataObj.icon_url) {
            await AssetImageModel.createAssetImage(
                transactionHash,
                assetType,
                metadataObj.icon_url
            );
        }
    } catch (err) {
        if (err instanceof Sequelize.UniqueConstraintError) {
            const duplicateFields = (err as any).fields;
            if (_.has(duplicateFields, "assetType")) {
                throw Exception.AlreadyExist();
            }
        }
        console.error(err);
        throw Exception.DBError();
    }
    return assetSchemeInstance;
}

export async function createAssetSchemeOfWCCC(
    transactionHash: string,
    networkId: string,
    shardId: number
): Promise<AssetSchemeInstance> {
    const assetType = H160.zero().value;
    const metadata = JSON.stringify({
        name: "wCCC",
        description:
            "CodeChain Coin, abbreviated as CCC, is the name of the currency used within CodeChain. wCCC can be exchanged for CCC through UnwrapCCC Transaction."
    });
    try {
        const assetSchemeInstance = await models.AssetScheme.create({
            transactionHash: strip0xPrefix(transactionHash),
            assetType: strip0xPrefix(assetType),
            metadata,
            approver: null,
            registrar: null,
            allowedScriptHashes: [],
            supply: U64.MAX_VALUE.toString(10),
            networkId,
            shardId,
            seq: 0
        });
        await AssetImageModel.createAssetImageOfWCCC(transactionHash);
        return assetSchemeInstance;
    } catch (err) {
        if (err instanceof Sequelize.UniqueConstraintError) {
            const duplicateFields = (err as any).fields;
            if (_.has(duplicateFields, "assetType")) {
                throw Exception.AlreadyExist();
            }
        }
        console.error(err);
        throw Exception.DBError();
    }
}

export async function updateAssetScheme(
    tx: TransactionInstance
): Promise<AssetSchemeInstance | AssetSchemeInstance[]> {
    const { changeAssetScheme, increaseAssetSupply, transferAsset } = tx.get({
        plain: true
    });
    if (changeAssetScheme) {
        const {
            assetType,
            metadata,
            registrar,
            approver,
            allowedScriptHashes
        } = changeAssetScheme;
        try {
            const [, [instance]] = await models.AssetScheme.update(
                {
                    metadata,
                    approver,
                    registrar,
                    allowedScriptHashes: allowedScriptHashes.map(hash =>
                        strip0xPrefix(hash)
                    )
                },
                {
                    where: { assetType },
                    returning: true
                }
            );
            return instance;
        } catch (err) {
            console.error(err);
            throw Exception.DBError();
        }
    }
    if (increaseAssetSupply) {
        const { assetType, supply } = increaseAssetSupply;
        try {
            const instance = await models.AssetScheme.findByPk(assetType).then(
                assetScheme => {
                    const updatedSupply = U64.plus(
                        assetScheme!.get().supply!,
                        supply
                    );
                    return assetScheme!.update({
                        supply: updatedSupply.toString()
                    });
                }
            );
            return instance;
        } catch (err) {
            console.error(err);
            throw Exception.DBError();
        }
    }
    if (transferAsset) {
        return Promise.all(
            transferAsset.burns.map(async burn => {
                const { quantity } = burn.prevOut;
                try {
                    const instance = await models.AssetScheme.findByPk(
                        burn.assetType
                    ).then(assetScheme => {
                        const updatedSupply = U64.minus(
                            assetScheme!.get().supply!,
                            quantity
                        );
                        return assetScheme!.update({
                            supply: updatedSupply.toString()
                        });
                    });
                    return instance;
                } catch (err) {
                    console.error(err);
                    throw Exception.DBError();
                }
            })
        );
    }
    console.error(
        "Unsupported transaction type for updateAssetScheme:",
        tx.get()!.type
    );
    throw Exception.InvalidTransaction();
}

export async function getByAssetType(
    assetType: H160
): Promise<AssetSchemeInstance | null> {
    try {
        return await models.AssetScheme.findByPk(
            strip0xPrefix(assetType.value)
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
