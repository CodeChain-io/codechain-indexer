import { AssetTransferInput, H256 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetDecomposeInputInstance } from "../assetdecomposeinput";
import { AssetSchemeAttribute } from "../assetscheme";
import models from "../index";
import * as AddressUtil from "./utils/address";
import * as UTXOModel from "./utxo";

// FIXME: This is duplicated with asset transfer-input
export async function createDecomposeInput(
    transactionHash: H256,
    input: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetDecomposeInputInstance> {
    let assetDecomposeInputInstance: AssetDecomposeInputInstance;
    try {
        const owner =
            input.prevOut.lockScriptHash &&
            input.prevOut.parameters &&
            AddressUtil.getOwner(
                input.prevOut.lockScriptHash,
                input.prevOut.parameters,
                options.networkId
            );
        assetDecomposeInputInstance = await models.AssetDecomposeInput.create({
            transactionHash: transactionHash.value,
            timelock: input.timelock,
            lockScript: input.lockScript,
            unlockScript: input.unlockScript,
            owner,
            assetType: input.prevOut.assetType.value,
            prevOut: {
                transactionHash: input.prevOut.transactionHash.value,
                index: input.prevOut.index,
                assetType: input.prevOut.assetType.value,
                assetScheme: options.assetScheme,
                amount: input.prevOut.amount.value.toString(10),
                owner,
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
        console.error(err);
        throw Exception.DBError;
    }
    return assetDecomposeInputInstance;
}

// This is for the cascade test
export async function getByHash(
    transactionHash: H256
): Promise<AssetDecomposeInputInstance | null> {
    try {
        return await models.AssetDecomposeInput.findOne({
            where: {
                transactionHash: transactionHash.value
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
