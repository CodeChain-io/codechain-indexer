import { AssetTransferInput, H256 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { AssetTransferBurnInstance } from "../assettransferburn";
import models from "../index";
import * as AddressUtil from "./utils/address";
import * as UTXOModel from "./utxo";

// FIXME: This is duplicated with asset transfer-input
export async function createAssetTransferBurn(
    transactionHash: H256,
    burn: AssetTransferInput,
    options: {
        networkId: string;
        assetScheme: AssetSchemeAttribute;
    }
): Promise<AssetTransferBurnInstance> {
    let assetTransferBurnInstance: AssetTransferBurnInstance;
    try {
        assetTransferBurnInstance = await models.AssetTransferBurn.create({
            transactionHash: transactionHash.value,
            timelock: burn.timelock,
            lockScript: burn.lockScript,
            unlockScript: burn.unlockScript,
            prevOut: {
                transactionHash: burn.prevOut.transactionHash.value,
                index: burn.prevOut.index,
                assetType: burn.prevOut.assetType.value,
                assetScheme: options.assetScheme,
                amount: burn.prevOut.amount.value.toString(10),
                owner:
                    burn.prevOut.lockScriptHash &&
                    burn.prevOut.parameters &&
                    AddressUtil.getOwner(
                        burn.prevOut.lockScriptHash,
                        burn.prevOut.parameters,
                        options.networkId
                    ),
                lockScriptHash:
                    burn.prevOut.lockScriptHash &&
                    burn.prevOut.lockScriptHash.value,
                parameters: burn.prevOut.parameters
            }
        });
        const utxoInst = await UTXOModel.getByTxHashIndex(
            burn.prevOut.transactionHash,
            burn.prevOut.index
        );
        if (!utxoInst) {
            throw Exception.InvalidUTXO;
        }
        await UTXOModel.setUsed(utxoInst.get().id!, transactionHash);
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return assetTransferBurnInstance;
}

// This is for the cascade test
export async function getByHash(
    transactionHash: H256
): Promise<AssetTransferBurnInstance[]> {
    try {
        return await models.AssetTransferBurn.findAll({
            where: {
                transactionHash: transactionHash.value
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
