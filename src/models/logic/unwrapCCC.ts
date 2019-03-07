import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { UnwrapCCC } from "codechain-sdk/lib/core/transaction/UnwrapCCC";
import models from "../index";
import { UnwrapCCCInstance } from "../unwrapCCC";
import { createAssetTransferBurn } from "./assettransferburn";
import { strip0xPrefix } from "./utils/format";

export async function createUnwrapCCC(
    transaction: SignedTransaction
): Promise<UnwrapCCCInstance> {
    const transactionHash = transaction.hash().value;
    const unwrap = transaction.unsigned as UnwrapCCC;
    const burn = unwrap.burn(0)!;
    const networkId = transaction.unsigned.networkId();
    await createAssetTransferBurn(transactionHash, burn, {
        networkId
    });
    return await models.UnwrapCCC.create({
        transactionHash: strip0xPrefix(transactionHash)
    });
}
