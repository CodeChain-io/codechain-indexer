import { Asset } from "codechain-sdk/lib/core/Asset";
import { AssetTransferOutput } from "codechain-sdk/lib/core/transaction/AssetTransferOutput";
import { TransferAsset } from "codechain-sdk/lib/core/transaction/TransferAsset";
import models from "../index";
import { TransferAssetInstance } from "../transferAsset";
import { createAssetTransferBurn } from "./assettransferburn";
import { createAssetTransferInput } from "./assettransferinput";
import { createAssetTransferOutput } from "./assettransferoutput";
import { createOrderOnTransfer } from "./orderontransfer";
import { strip0xPrefix } from "./utils/format";

export async function createTransferAsset(
    transactionHash: string,
    transfer: TransferAsset,
    params: {
        networkId: string;
        approvals: string[];
        inputs: any[];
        burns: any[];
        outputs: any[];
    }
): Promise<TransferAssetInstance> {
    const { networkId, approvals, inputs, outputs, burns } = params;
    const result = await models.TransferAsset.create({
        transactionHash: strip0xPrefix(transactionHash),
        networkId,
        approvals
    });
    await Promise.all(
        inputs.map(async (_: any, index: number) => {
            const input = transfer.input(index)!;
            await createAssetTransferInput(transactionHash, input, {
                networkId
            });
        })
    );
    await Promise.all(
        burns.map(async (_: any, index: number) => {
            const input = transfer.burn(index)!;
            await createAssetTransferBurn(transactionHash, input, {
                networkId
            });
        })
    );
    await Promise.all(
        outputs.map(async (json: any, transactionOutputIndex: number) => {
            const output = AssetTransferOutput.fromJSON(json);
            return createAssetTransferOutput(transactionHash, output, {
                networkId,
                asset: new Asset({
                    assetType: output.assetType,
                    shardId: output.shardId,
                    lockScriptHash: output.lockScriptHash,
                    parameters: output.parameters,
                    quantity: output.quantity,
                    orderHash: null,
                    tracker: transfer.tracker(),
                    transactionOutputIndex
                })
            });
        })
    );
    await Promise.all(
        transfer.orders().map(orderOnTransfer => {
            return createOrderOnTransfer(
                transactionHash,
                orderOnTransfer,
                networkId
            );
        })
    );

    return result;
}
