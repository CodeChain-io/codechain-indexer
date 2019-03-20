import { AssetTransferInput } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetTransferBurnInstance } from "../assettransferburn";
import models from "../index";
import { getByTracker } from "./transaction";
import * as AddressUtil from "./utils/address";
import { strip0xPrefix } from "./utils/format";

// FIXME: This is duplicated with asset transfer-input
export async function createAssetTransferBurn(
    transactionHash: string,
    burn: AssetTransferInput,
    index: number
): Promise<AssetTransferBurnInstance> {
    let assetTransferBurnInstance: AssetTransferBurnInstance;
    try {
        const prevTxs = await getByTracker(burn.prevOut.tracker).then(txs =>
            txs.map(tx => tx.get({ plain: true }))
        );
        const { lockScriptHash, parameters, owner } =
            prevTxs.length === 0
                ? { lockScriptHash: null, parameters: null, owner: null }
                : AddressUtil.getOwnerFromTransaction(
                      prevTxs[0],
                      burn.prevOut.index
                  );
        const successfulTx = prevTxs.find(tx => tx.success === true);
        const prevHash = successfulTx && successfulTx.hash;
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
