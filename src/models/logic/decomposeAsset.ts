import { Asset } from "codechain-sdk/lib/core/Asset";
import { AssetTransferOutput } from "codechain-sdk/lib/core/transaction/AssetTransferOutput";
import { DecomposeAsset } from "codechain-sdk/lib/core/transaction/DecomposeAsset";
import { DecomposeAssetInstance } from "../decomposeAsset";
import models from "../index";
import { createAssetTransferBurn } from "./assettransferburn";
import { createAssetTransferOutput } from "./assettransferoutput";
import { getAssetScheme } from "./utils/asset";
import { strip0xPrefix } from "./utils/format";

export async function createDecomposeAsset(
    transactionHash: string,
    decompose: DecomposeAsset,
    params: {
        networkId: string;
        approvals: string[];
        outputs: any[];
    }
): Promise<DecomposeAssetInstance> {
    const { networkId, approvals, outputs } = params;

    const result = await models.DecomposeAsset.create({
        transactionHash: strip0xPrefix(transactionHash),
        networkId,
        approvals
    });
    const input = decompose.input(0)!;
    const inputAssetScheme = await getAssetScheme(input.prevOut.assetType);
    await createAssetTransferBurn(transactionHash, input, {
        networkId,
        assetScheme: inputAssetScheme
    });

    await Promise.all(
        outputs.map(async (json: any, transactionOutputIndex: number) => {
            // FIXME
            const output = AssetTransferOutput.fromJSON(json);
            const assetScheme = await getAssetScheme(output.assetType);
            await createAssetTransferOutput(transactionHash, output, {
                networkId,
                asset: new Asset({
                    assetType: output.assetType,
                    shardId: output.shardId,
                    lockScriptHash: output.lockScriptHash,
                    parameters: output.parameters,
                    quantity: output.quantity,
                    orderHash: null,
                    tracker: decompose.tracker(),
                    transactionOutputIndex
                }),
                assetScheme
            });
        })
    );
    return result;
}
