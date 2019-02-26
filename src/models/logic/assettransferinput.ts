import { AssetTransferInput, H160 } from "codechain-sdk/lib/core/classes";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferInputInstance } from "../assettransferinput";
import models from "../index";
import { UTXOAttribute } from "../utxo";
import * as AddressUtil from "./utils/address";
import { strip0xPrefix } from "./utils/format";
import { getByTxTrackerIndex } from "./utxo";

// FIXME: This is duplicated with asset transfer-burn, decompose input
export async function createAssetTransferInput(
    transactionHash: string,
    input: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetTransferInputInstance> {
    let assetTransferInputInstance: AssetTransferInputInstance;
    try {
        const {
            lockScriptHash,
            parameters,
            transactionHash: prevHash
        } = await getByTxTrackerIndex(
            input.prevOut.tracker,
            input.prevOut.index
        ).then(utxo =>
            utxo === null ? ({} as UTXOAttribute) : utxo.get({ plain: true })
        );
        const owner =
            lockScriptHash &&
            AddressUtil.getOwner(
                H160.ensure(lockScriptHash),
                parameters,
                options.networkId
            );
        assetTransferInputInstance = await models.AssetTransferInput.create({
            transactionHash: strip0xPrefix(transactionHash),
            timelock: input.timelock,
            lockScript: input.lockScript,
            unlockScript: input.unlockScript,
            owner,
            assetType: strip0xPrefix(input.prevOut.assetType.value),
            shardId: input.prevOut.shardId,
            prevOut: {
                tracker: strip0xPrefix(input.prevOut.tracker.value),
                hash: strip0xPrefix(prevHash),
                index: input.prevOut.index,
                assetType: strip0xPrefix(input.prevOut.assetType.value),
                shardId: input.prevOut.shardId,
                quantity: input.prevOut.quantity.value.toString(10),
                owner,
                lockScriptHash: strip0xPrefix(lockScriptHash),
                parameters: parameters.map(p => strip0xPrefix(p))
            }
        });
    } catch (err) {
        console.log(err);
        throw Exception.DBError();
    }
    return assetTransferInputInstance;
}

// This is for the cascade test
export async function getByTransactionHash(
    transactionHash: string
): Promise<AssetTransferInputInstance[]> {
    try {
        return await models.AssetTransferInput.findAll({
            where: {
                transactionHash: strip0xPrefix(transactionHash)
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}
