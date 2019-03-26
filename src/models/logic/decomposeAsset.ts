import { H160, SignedTransaction } from "codechain-sdk/lib/core/classes";
import { AssetTransferOutput } from "codechain-sdk/lib/core/transaction/AssetTransferOutput";
import {
    DecomposeAsset,
    DecomposeAssetActionJSON
} from "codechain-sdk/lib/core/transaction/DecomposeAsset";
import { DecomposeAssetInstance } from "../decomposeAsset";
import models from "../index";
import {
    createAssetTransferOutput,
    getOutputOwner
} from "./assettransferoutput";
import { getOwner } from "./utils/address";
import { strip0xPrefix } from "./utils/format";

export async function createDecomposeAsset(
    transaction: SignedTransaction
): Promise<DecomposeAssetInstance> {
    const transactionHash = transaction.hash().value;
    const decompose = transaction.unsigned as DecomposeAsset;
    const { networkId, approvals, input, outputs } = transaction.toJSON()
        .action as DecomposeAssetActionJSON;

    const { owner, lockScriptHash, parameters } = await getOutputOwner(
        input.prevOut.tracker,
        input.prevOut.index
    );
    const result = await models.DecomposeAsset.create({
        transactionHash: strip0xPrefix(transactionHash),
        networkId,
        approvals,
        input: {
            index: 0,
            prevOut: {
                tracker: strip0xPrefix(input.prevOut.tracker),
                index: input.prevOut.index,
                assetType: strip0xPrefix(input.prevOut.assetType),
                shardId: input.prevOut.shardId,
                quantity: input.prevOut.quantity,
                owner,
                lockScriptHash,
                parameters
            },
            timelock: input.timelock,
            assetType: strip0xPrefix(input.prevOut.assetType),
            shardId: input.prevOut.shardId,
            lockScript: Buffer.from(input.lockScript),
            unlockScript: Buffer.from(input.unlockScript),
            owner
        },
        outputs: outputs.map((o, index) => {
            return {
                index,
                lockScriptHash: strip0xPrefix(o.lockScriptHash),
                parameters: o.parameters.map(p => strip0xPrefix(p)),
                assetType: strip0xPrefix(o.assetType),
                shardId: o.shardId,
                quantity: o.quantity,
                owner: getOwner(
                    new H160(o.lockScriptHash),
                    o.parameters,
                    decompose.networkId()
                )
            };
        })
    });

    await Promise.all(
        outputs.map((output, index) => {
            return createAssetTransferOutput(
                transactionHash,
                decompose.tracker().value,
                AssetTransferOutput.fromJSON(output),
                index,
                {
                    networkId
                }
            );
        })
    );
    return result;
}
