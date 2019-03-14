import { AssetTransferInput, H160 } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetTransferBurnInstance } from "../assettransferburn";
import models from "../index";
import * as AddressUtil from "./utils/address";
import { strip0xPrefix } from "./utils/format";
import { getByTxTrackerIndex } from "./utxo";

// FIXME: This is duplicated with asset transfer-input
export async function createAssetTransferBurn(
    transactionHash: string,
    burn: AssetTransferInput,
    index: number,
    options: {
        networkId: string;
    }
): Promise<AssetTransferBurnInstance> {
    let assetTransferBurnInstance: AssetTransferBurnInstance;
    try {
        const {
            lockScriptHash,
            parameters,
            transactionHash: prevHash
        } = await getByTxTrackerIndex(
            burn.prevOut.tracker,
            burn.prevOut.index
        ).then(utxo =>
            utxo === null
                ? ({} as {
                      lockScriptHash: undefined;
                      parameters: undefined;
                      transactionHash: undefined;
                  })
                : utxo.get({ plain: true })
        );
        const owner =
            lockScriptHash &&
            parameters &&
            AddressUtil.getOwner(
                H160.ensure(lockScriptHash),
                parameters,
                options.networkId
            );
        assetTransferBurnInstance = await models.AssetTransferBurn.create({
            transactionHash: strip0xPrefix(transactionHash),
            index,
            timelock: burn.timelock,
            lockScript: burn.lockScript,
            unlockScript: burn.unlockScript,
            owner,
            assetType: strip0xPrefix(burn.prevOut.assetType.value),
            shardId: burn.prevOut.shardId,
            prevOut: {
                tracker: strip0xPrefix(burn.prevOut.tracker.value),
                hash: prevHash && strip0xPrefix(prevHash),
                index: burn.prevOut.index,
                assetType: strip0xPrefix(burn.prevOut.assetType.value),
                shardId: burn.prevOut.shardId,
                quantity: burn.prevOut.quantity.value.toString(10),
                owner,
                lockScriptHash: lockScriptHash && strip0xPrefix(lockScriptHash),
                parameters: parameters && parameters.map(p => strip0xPrefix(p))
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
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
                transactionHash: strip0xPrefix(transactionHash)
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
