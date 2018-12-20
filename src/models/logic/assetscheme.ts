import { AssetScheme, H256 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Exception from "../../exception";
import { AssetSchemeInstance } from "../assetscheme";
import models from "../index";

export async function createAssetScheme(
    assetType: H256,
    transactionHash: H256,
    assetScheme: AssetScheme
): Promise<AssetSchemeInstance> {
    let assetSchemeInstance: AssetSchemeInstance;
    try {
        assetSchemeInstance = await models.AssetScheme.create({
            assetType: assetType.value,
            transactionHash: transactionHash.value,
            metadata: assetScheme.metadata,
            approver: assetScheme.approver && assetScheme.approver.value,
            administrator:
                assetScheme.administrator && assetScheme.administrator.value,
            amount: assetScheme.amount.value.toString(10),
            networkId: assetScheme.networkId,
            shardId: assetScheme.shardId
        });
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

export async function getByAssetType(
    assetType: H256
): Promise<AssetSchemeInstance | null> {
    try {
        return await models.AssetScheme.findOne({
            where: {
                assetType: assetType.value
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
