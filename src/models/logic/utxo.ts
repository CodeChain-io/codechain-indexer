import { Asset, H256 } from "codechain-sdk/lib/core/classes";
import models from "..";
import * as Exception from "../../exception";
import { AssetSchemeAttribute } from "../assetscheme";
import { UTXOInstance } from "../utxo";
import * as AssetSchemeModel from "./assetscheme";

export async function createUTXO(
    address: string,
    utxo: Asset
): Promise<UTXOInstance> {
    let utxoInstance;
    try {
        const assetScheme = await getAssetSheme(utxo.assetType);
        utxoInstance = await models.UTXO.create({
            address,
            assetType: utxo.assetType.value,
            lockScriptHash: utxo.lockScriptHash.value,
            parameters: utxo.parameters,
            amount: utxo.amount.value.toString(10),
            transactionHash: utxo.outPoint.transactionHash.value,
            transactionOutputIndex: utxo.outPoint.index,
            assetScheme
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return utxoInstance;
}

export async function setUsed(id: string, usedTransactionHash: H256) {
    try {
        return await models.UTXO.update(
            {
                usedTransaction: usedTransactionHash.value
            },
            {
                where: {
                    id
                }
            }
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

async function getAssetSheme(assetType: H256): Promise<AssetSchemeAttribute> {
    const assetSchemeInstance = await AssetSchemeModel.getByAssetType(
        assetType
    );
    if (!assetSchemeInstance) {
        throw Exception.InvalidTransaction;
    }
    return assetSchemeInstance.get({
        plain: true
    });
}

export async function getByAddress(address: string): Promise<UTXOInstance[]> {
    try {
        return await models.UTXO.findAll({
            where: {
                address,
                usedTransaction: null
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getByAssetType(assetType: H256) {
    try {
        return await models.UTXO.findAll({
            where: {
                assetType: assetType.value,
                usedTransaction: null
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getByTxHashIndex(
    transactionHash: H256,
    outputIndex: number
) {
    try {
        return await models.UTXO.findOne({
            where: {
                transactionHash: transactionHash.value,
                transactionOutputIndex: outputIndex
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
