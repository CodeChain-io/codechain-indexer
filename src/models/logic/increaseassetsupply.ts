import { H160 } from "codechain-primitives/lib";
import {
    AssetTransferOutput,
    SignedTransaction
} from "codechain-sdk/lib/core/classes";
import { AssetMintOutput } from "codechain-sdk/lib/core/transaction/AssetMintOutput";
import {
    IncreaseAssetSupply,
    IncreaseAssetSupplyActionJSON
} from "codechain-sdk/lib/core/transaction/IncreaseAssetSupply";
import { IncreaseAssetSupplyInstance } from "../increaseAssetSupply";
import models from "../index";
import { createAssetTransferOutput } from "./assettransferoutput";
import { getOwner } from "./utils/address";
import { strip0xPrefix } from "./utils/format";

export async function createIncreaseAssetSupply(
    transaction: SignedTransaction
): Promise<IncreaseAssetSupplyInstance> {
    const transactionHash = transaction.hash().value;
    const increaseAssetSupply = transaction.unsigned as IncreaseAssetSupply;
    const { networkId, action } = increaseAssetSupply.toJSON();
    const {
        shardId,
        assetType,
        output,
        approvals
    } = action as IncreaseAssetSupplyActionJSON;

    const incSupplyOutput = AssetMintOutput.fromJSON(output);
    const { lockScriptHash, parameters } = output;
    const supply = incSupplyOutput.supply!.toString(10);
    const recipient = getOwner(new H160(lockScriptHash), parameters, networkId);
    const inst = await models.IncreaseAssetSupply.create({
        transactionHash: strip0xPrefix(transactionHash),
        networkId,
        shardId,
        assetType: strip0xPrefix(assetType),
        approvals,
        lockScriptHash: strip0xPrefix(lockScriptHash),
        parameters: parameters.map(p => strip0xPrefix(p)),
        recipient,
        supply
    });
    await createAssetTransferOutput(
        transactionHash,
        increaseAssetSupply.tracker().toString(),
        new AssetTransferOutput({
            lockScriptHash: incSupplyOutput.lockScriptHash,
            parameters: incSupplyOutput.parameters,
            quantity: incSupplyOutput.supply,
            shardId,
            assetType: new H160(assetType)
        }),
        0,
        { networkId }
    );
    return inst;
}
