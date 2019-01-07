import * as _ from "lodash";
import { BlockAttribute } from "../../block";

export function getTransactions(block: BlockAttribute) {
    return _.chain(block.transactions).value();
}
