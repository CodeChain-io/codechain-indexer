import { AssetTransferInput, H256 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferInputInstance } from "../assettransferinput";
import models from "../index";
import * as AddressUtil from "./utils/address";
import * as UTXOModel from "./utxo";

// FIXME: This is duplicated with asset transfer-burn, decompose input
export async function createAssetTransferInput(
    transactionHash: H256,
    input: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetTransferInputInstance> {
    let assetTransferInputInstance: AssetTransferInputInstance;
    try {
        assetTransferInputInstance = await models.AssetTransferInput.create({
            transactionHash: transactionHash.value,
            timelock: input.timelock,
            lockScript: input.lockScript,
            unlockScript: input.unlockScript,
            prevOut: {
                transactionHash: input.prevOut.transactionHash.value,
                index: input.prevOut.index,
                assetType: input.prevOut.assetType.value,
                assetScheme: options.assetScheme,
                amount: input.prevOut.amount.value.toString(10),
                owner:
                    input.prevOut.lockScriptHash &&
                    input.prevOut.parameters &&
                    AddressUtil.getOwner(
                        input.prevOut.lockScriptHash,
                        input.prevOut.parameters,
                        options.networkId
                    ),
                lockScriptHash:
                    input.prevOut.lockScriptHash &&
                    input.prevOut.lockScriptHash.value,
                parameters: input.prevOut.parameters
            }
        });
        const utxoInst = await UTXOModel.getByTxHashIndex(
            input.prevOut.transactionHash,
            input.prevOut.index
        );
        if (!utxoInst) {
            throw Exception.InvalidUTXO;
        }
        await UTXOModel.setUsed(utxoInst.get().id!, transactionHash);
    } catch (err) {
        console.log(err);
        throw Exception.DBError;
    }
    return assetTransferInputInstance;
}

// This is for the cascade test
export async function getByHash(
    transactionHash: H256
): Promise<AssetTransferInputInstance[]> {
    try {
        return await models.AssetTransferInput.findAll({
            where: {
                transactionHash: transactionHash.value
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
