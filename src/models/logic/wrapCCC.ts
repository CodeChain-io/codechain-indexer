import { H160, U64 } from "codechain-sdk/lib/core/classes";
import { UniqueConstraintError } from "sequelize";
import models from "../index";
import { WrapCCCInstance } from "../wrapCCC";
import { createAssetScheme } from "./assetscheme";
import { getOwner } from "./utils/address";

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
        transactionHash,
        shardId,
        lockScriptHash,
        parameters,
        quantity,
        recipient
    });
    const shardIdString = shardId.toString(16).padStart(4, "0");
    const assetType = `5300${shardIdString}00000000000000000000000000000000000000000000000000000000`;
    try {
        await createAssetScheme(assetType, transactionHash, {
            metadata: "WCCC",
            approver: null,
            administrator: null,
            allowedScriptHashes: [],
            supply: U64.MAX_VALUE,
            networkId,
            shardId
        });
    } catch (err) {
        if (err instanceof UniqueConstraintError) {
            // Asset Scheme of WCCC can be duplicated
            return result;
        }
        console.error(err);
        throw err;
    }
    return result;
}
