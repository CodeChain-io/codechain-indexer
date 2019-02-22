import { H160, U64 } from "codechain-sdk/lib/core/classes";
import models from "../index";
import { WrapCCCInstance } from "../wrapCCC";
import { createAssetSchemeOfWCCC } from "./assetscheme";
import { getOwner } from "./utils/address";
import { strip0xPrefix } from "./utils/format";

export async function createWrapCCC(
    transactionHash: string,
    params: {
        networkId: string;
        shardId: number;
        lockScriptHash: string;
        parameters: string[];
        quantity: string;
    }
): Promise<WrapCCCInstance> {
    const { networkId, shardId, lockScriptHash, parameters } = params;
    const quantity = U64.ensure(params.quantity).toString(10);

    const recipient = getOwner(new H160(lockScriptHash), parameters, networkId);

    const result = await models.WrapCCC.create({
        transactionHash: strip0xPrefix(transactionHash),
        shardId,
        lockScriptHash: strip0xPrefix(lockScriptHash),
        parameters: parameters.map(p => strip0xPrefix(p)),
        quantity,
        recipient
    });
    const existing = await models.AssetScheme.findByPk(H160.zero().toString());
    if (existing == null) {
        await createAssetSchemeOfWCCC(transactionHash, networkId, shardId);
    }
    return result;
}
