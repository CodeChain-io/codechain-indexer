import { AssetTransferInput } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetTransferInputInstance } from "../assettransferinput";
import models from "../index";
import { getByTracker } from "./transaction";
import * as AddressUtil from "./utils/address";
import { strip0xPrefix } from "./utils/format";

// FIXME: This is duplicated with asset transfer-burn, decompose input
export async function createAssetTransferInput(
    transactionHash: string,
    input: AssetTransferInput,
    index: number
): Promise<AssetTransferInputInstance> {
    let assetTransferInputInstance: AssetTransferInputInstance;
    try {
        const prevTxs = await getByTracker(input.prevOut.tracker).then(txs =>
            txs.map(tx => tx.get({ plain: true }))
        );
        const { lockScriptHash, parameters, owner } =
            prevTxs.length === 0
                ? { lockScriptHash: null, parameters: null, owner: null }
                : AddressUtil.getOwnerFromTransaction(
                      prevTxs[0],
                      input.prevOut.index
                  );
        const successfulTx = prevTxs.find(tx => tx.success === true);
        const prevHash = successfulTx && successfulTx.hash;
        assetTransferInputInstance = await models.AssetTransferInput.create({
            transactionHash: strip0xPrefix(transactionHash),
            index,
            timelock: input.timelock,
            lockScript: input.lockScript,
            unlockScript: input.unlockScript,
            owner,
            assetType: strip0xPrefix(input.prevOut.assetType.value),
            shardId: input.prevOut.shardId,
            prevOut: {
                tracker: strip0xPrefix(input.prevOut.tracker.value),
                hash: prevHash && strip0xPrefix(prevHash),
                index: input.prevOut.index,
                assetType: strip0xPrefix(input.prevOut.assetType.value),
                shardId: input.prevOut.shardId,
                quantity: input.prevOut.quantity.value.toString(10),
                owner,
                lockScriptHash: lockScriptHash && strip0xPrefix(lockScriptHash),
                parameters: parameters && parameters.map(p => strip0xPrefix(p))
            }
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError();
    }
    return assetTransferInputInstance;
}

// This is for the cascade test
export async function getByTransactionHash(
    transactionHash: string
): Promise<AssetTransferInputInstance[]> {
    try {
        return await models.AssetTransferInput.findAll({
            where: {
                transactionHash: strip0xPrefix(transactionHash)
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
