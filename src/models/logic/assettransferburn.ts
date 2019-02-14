import { AssetTransferInput, H160 } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferBurnInstance } from "../assettransferburn";
import models from "../index";
import * as AddressUtil from "./utils/address";
import { getByTxTrackerIndex } from "./utxo";

// FIXME: This is duplicated with asset transfer-input
export async function createAssetTransferBurn(
    transactionHash: string,
    burn: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetTransferBurnInstance> {
    let assetTransferBurnInstance: AssetTransferBurnInstance;
    try {
        const { lockScriptHash, parameters } = await getByTxTrackerIndex(
            burn.prevOut.tracker,
            burn.prevOut.index
        ).then(
            utxo => (utxo === null ? ({} as any) : utxo.get({ plain: true }))
        );
        const owner =
            lockScriptHash &&
            AddressUtil.getOwner(
                H160.ensure(lockScriptHash),
                parameters,
                options.networkId
            );
        assetTransferBurnInstance = await models.AssetTransferBurn.create({
            transactionHash,
            timelock: burn.timelock,
            lockScript: burn.lockScript,
            unlockScript: burn.unlockScript,
            owner,
            assetType: burn.prevOut.assetType.value,
            shardId: burn.prevOut.shardId,
            prevOut: {
                tracker: burn.prevOut.tracker.value,
                index: burn.prevOut.index,
                assetType: burn.prevOut.assetType.value,
                shardId: burn.prevOut.shardId,
                quantity: burn.prevOut.quantity.value.toString(10),
                owner,
                lockScriptHash,
                parameters
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return assetTransferBurnInstance;
}

// This is for the cascade test
export async function getByTransactionHash(
    transactionHash: string
): Promise<AssetTransferBurnInstance[]> {
    try {
        return await models.AssetTransferBurn.findAll({
            where: {
                transactionHash
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
