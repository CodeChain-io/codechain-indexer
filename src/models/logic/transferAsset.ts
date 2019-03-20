import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { AssetTransferOutput } from "codechain-sdk/lib/core/transaction/AssetTransferOutput";
import {
    TransferAsset,
    TransferAssetActionJSON
} from "codechain-sdk/lib/core/transaction/TransferAsset";
import models from "../index";
import { TransferAssetInstance } from "../transferAsset";
import { createAssetTransferBurn } from "./assettransferburn";
import { createAssetTransferInput } from "./assettransferinput";
import { createAssetTransferOutput } from "./assettransferoutput";
import { createOrderOnTransfer } from "./orderontransfer";
import { strip0xPrefix } from "./utils/format";

export async function createTransferAsset(
    transaction: SignedTransaction
): Promise<TransferAssetInstance> {
    const {
        networkId,
        metadata,
        approvals,
        expiration,
        inputs,
        outputs,
        burns
    } = transaction.toJSON().action as TransferAssetActionJSON;
    const transfer = transaction.unsigned as TransferAsset;
    const transactionHash = transaction.hash().value;
    const result = await models.TransferAsset.create({
        transactionHash: strip0xPrefix(transactionHash),
        networkId,
        metadata,
        approvals,
        expiration: expiration == null ? null : String(expiration)
    });
    await Promise.all(
        inputs.map(async (_: any, index: number) => {
            const input = transfer.input(index)!;
            await createAssetTransferInput(transactionHash, input, index);
        })
    );
    await Promise.all(
        burns.map(async (_: any, index: number) => {
            const input = transfer.burn(index)!;
            await createAssetTransferBurn(transactionHash, input, index);
        })
    );
    await Promise.all(
        outputs.map(async (json: any, transactionOutputIndex: number) => {
            const output = AssetTransferOutput.fromJSON(json);
            return createAssetTransferOutput(
                transactionHash,
                output,
                transactionOutputIndex,
                {
                    networkId
                }
            );
        })
    );
    await Promise.all(
        transfer.orders().map((orderOnTransfer, index) => {
            return createOrderOnTransfer(
                transactionHash,
                orderOnTransfer,
                index,
                networkId
            );
        })
    );

    return result;
}
