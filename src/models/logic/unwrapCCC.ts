import { SignedTransaction, U64 } from "codechain-sdk/lib/core/classes";
import {
    UnwrapCCC,
    UnwrapCCCActionJSON
} from "codechain-sdk/lib/core/transaction/UnwrapCCC";
import models from "../index";
import { UnwrapCCCInstance } from "../unwrapCCC";
import { createAddressLog } from "./addressLog";
import { getOutputOwner } from "./assettransferoutput";
import { createAssetTypeLog } from "./assetTypeLog";
import { strip0xPrefix } from "./utils/format";

export async function createUnwrapCCC(
    transaction: SignedTransaction
): Promise<UnwrapCCCInstance> {
    const transactionHash = transaction.hash().value;
    const unwrap = transaction.unsigned as UnwrapCCC;
    const { receiver, burn } = unwrap.toJSON().action as UnwrapCCCActionJSON;
    const { owner, lockScriptHash, parameters } = await getOutputOwner(
        burn.prevOut.tracker,
        burn.prevOut.index
    );
    const instance = models.UnwrapCCC.create({
        transactionHash: strip0xPrefix(transactionHash),
        receiver,
        burn: {
            index: 0,
            prevOut: {
                tracker: strip0xPrefix(burn.prevOut.tracker),
                index: burn.prevOut.index,
                assetType: strip0xPrefix(burn.prevOut.assetType),
                shardId: burn.prevOut.shardId,
                quantity: new U64(burn.prevOut.quantity).toString(),
                owner,
                lockScriptHash,
                parameters
            },
            timelock: burn.timelock,
            assetType: strip0xPrefix(burn.prevOut.assetType),
            shardId: burn.prevOut.shardId,
            lockScript: Buffer.from(burn.lockScript),
            unlockScript: Buffer.from(burn.unlockScript),
            owner
        }
    });
    if (owner) {
        await createAddressLog(transaction, owner, "AssetOwner");
    }
    await createAddressLog(transaction, receiver, "AssetOwner");
    await createAssetTypeLog(
        transaction,
        "0000000000000000000000000000000000000000"
    );
    return instance;
}
