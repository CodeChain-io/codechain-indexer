import * as _ from "lodash";
import { AssetTransactionAttribute } from "../../action";
import { BlockAttribute } from "../../block";

export function getTransactions(block: BlockAttribute) {
    return _.chain(block.parcels)
        .filter(parcel => parcel.action!.action === "assetTransaction")
        .map(parcel => (parcel.action as AssetTransactionAttribute).transaction)
        .value();
}
