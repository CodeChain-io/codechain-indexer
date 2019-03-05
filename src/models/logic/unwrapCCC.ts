import { UnwrapCCC } from "codechain-sdk/lib/core/transaction/UnwrapCCC";
import { NetworkId } from "codechain-sdk/lib/core/types";
import models from "../index";
import { UnwrapCCCInstance } from "../unwrapCCC";
import { createAssetTransferBurn } from "./assettransferburn";
import { strip0xPrefix } from "./utils/format";

export async function createUnwrapCCC(
    transactionHash: string,
    unwrap: UnwrapCCC,
    networkId: NetworkId
): Promise<UnwrapCCCInstance> {
    const burn = unwrap.burn(0)!;
    await createAssetTransferBurn(transactionHash, burn, {
        networkId
    });
    return await models.UnwrapCCC.create({
        transactionHash: strip0xPrefix(transactionHash)
    });
}
