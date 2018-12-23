import { Asset } from "codechain-sdk/lib/core/classes";
import models from "..";
import * as Exception from "../../exception";
import { AccountInstance } from "../account";
import { UTXOInstance } from "../utxo";

export async function createUTXO(
    address: string,
    utxo: Asset
): Promise<UTXOInstance> {
    let utxoInstance;
    try {
        utxoInstance = await models.UTXO.create({
            address,
            assetType: utxo.assetType.value,
            lockScriptHash: utxo.lockScriptHash.value,
            parameters: utxo.parameters,
            amount: utxo.amount.value.toString(10),
            transactionHash: utxo.outPoint.transactionHash.value,
            transactionOutputIndex: utxo.outPoint.index,
            isUsed: false
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
    return utxoInstance;
}

export async function setUsed() {
    // TODO
}

export async function setUnUsed() {
    // TODO
}

export async function getByAddress(
    address: string
): Promise<AccountInstance | null> {
    try {
        return await models.Account.findOne({
            where: {
                address
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}
