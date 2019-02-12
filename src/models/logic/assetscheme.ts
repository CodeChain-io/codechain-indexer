import { H160, PlatformAddress, U64 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { AssetSchemeInstance } from "../assetscheme";
import models from "../index";
import * as AssetImageModel from "./assetimage";

export async function createAssetScheme(
    assetType: string,
    transactionHash: string,
    assetScheme: {
        metadata: string;
        approver: PlatformAddress | null;
        administrator: PlatformAddress | null;
        allowedScriptHashes: H160[];
        supply: U64;
        networkId: string;
        shardId: number;
    }
): Promise<AssetSchemeInstance> {
    let assetSchemeInstance: AssetSchemeInstance;
    try {
        assetSchemeInstance = await models.AssetScheme.create({
            transactionHash,
            assetType,
            metadata: assetScheme.metadata,
            approver: assetScheme.approver && assetScheme.approver.value,
            administrator:
                assetScheme.administrator && assetScheme.administrator.value,
            allowedScriptHashes: assetScheme.allowedScriptHashes.map(
                hash => hash.value
            ),
            supply: assetScheme.supply.value.toString(10),
            networkId: assetScheme.networkId,
            shardId: assetScheme.shardId
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
                throw Exception.AlreadyExist;
            }
        }
        console.error(err);
        throw Exception.DBError;
    }
    return assetSchemeInstance;
}

export async function createAssetSchemeOfWCCC(
    transactionHash: string,
    networkId: string,
    shardId: number
): Promise<AssetSchemeInstance> {
    const assetType = H160.zero().value;
    const metadata = "WCCC"; // FIXME
    try {
        const assetSchemeInstance = await models.AssetScheme.create({
            transactionHash,
            assetType,
            metadata,
            approver: null,
            administrator: null,
            allowedScriptHashes: [],
            supply: U64.MAX_VALUE.toString(10),
            networkId,
            shardId
        });

        // FIXME: Create asset image
        return assetSchemeInstance;
    } catch (err) {
        if (err instanceof Sequelize.UniqueConstraintError) {
            const duplicateFields = (err as any).fields;
            if (_.has(duplicateFields, "assetType")) {
                throw Exception.AlreadyExist;
            }
        }
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getByAssetType(
    assetType: H160
): Promise<AssetSchemeInstance | null> {
    try {
        return await models.AssetScheme.findByPk(assetType.value);
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
