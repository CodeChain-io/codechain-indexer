import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { AssetTransferOutput } from "codechain-sdk/lib/core/transaction/AssetTransferOutput";
import {
    DecomposeAsset,
    DecomposeAssetActionJSON
} from "codechain-sdk/lib/core/transaction/DecomposeAsset";
import { DecomposeAssetInstance } from "../decomposeAsset";
import models from "../index";
import { createAssetTransferBurn } from "./assettransferburn";
import { createAssetTransferOutput } from "./assettransferoutput";
import { strip0xPrefix } from "./utils/format";

export async function createDecomposeAsset(
    transaction: SignedTransaction
): Promise<DecomposeAssetInstance> {
    const transactionHash = transaction.hash().value;
    const decompose = transaction.unsigned as DecomposeAsset;
    const { networkId, approvals, outputs } = transaction.toJSON()
        .action as DecomposeAssetActionJSON;

    const result = await models.DecomposeAsset.create({
        transactionHash: strip0xPrefix(transactionHash),
        networkId,
        approvals
    });
    const input = decompose.input(0)!;
    await createAssetTransferBurn(transactionHash, input, {
        networkId
    });

    await Promise.all(
        outputs.map(async (json: any, transactionOutputIndex: number) => {
            // FIXME
            const output = AssetTransferOutput.fromJSON(json);
            await createAssetTransferOutput(
                transactionHash,
                output,
                transactionOutputIndex,
                {
                    networkId
                }
            );
        })
    );
    return result;
}
