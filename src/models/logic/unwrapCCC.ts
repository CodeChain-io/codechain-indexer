import { UnwrapCCC } from "codechain-sdk/lib/core/transaction/UnwrapCCC";
import { NetworkId } from "codechain-sdk/lib/core/types";
import models from "../index";
import { UnwrapCCCInstance } from "../unwrapCCC";
import { createAssetTransferBurn } from "./assettransferburn";
import { getAssetScheme } from "./utils/asset";

export async function createUnwrapCCC(
    transactionHash: string,
    unwrap: UnwrapCCC,
    networkId: NetworkId
): Promise<UnwrapCCCInstance> {
    const burn = unwrap.burn(0)!;
    const assetScheme = await getAssetScheme(burn.prevOut.assetType);
    await createAssetTransferBurn(transactionHash, burn, {
        networkId,
        assetScheme
    });
    return await models.UnwrapCCC.create({
        transactionHash
    });
}
