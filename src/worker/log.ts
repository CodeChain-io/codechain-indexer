import * as _ from "lodash";
import * as moment from "moment";
import * as LogModel from "../../src/models/logic/log";
import { BlockAttribute } from "../models/block";
import { LogType } from "../models/log";
import { getNumberOfEachTransactionType } from "../models/logic/transaction";

export async function indexLog(block: BlockAttribute, isRetracted: boolean) {
    const dateString = moment
        .unix(block.timestamp)
        .utc()
        .format("YYYY-MM-DD");
    await queryLog(isRetracted, dateString, LogType.BLOCK_COUNT, 1);
    await queryLog(
        isRetracted,
        dateString,
        LogType.BLOCK_MINING_COUNT,
        1,
        block.author
    );
    if (block.transactionsCount) {
        await queryLog(
            isRetracted,
            dateString,
            LogType.TX_COUNT,
            parseInt(block.transactionsCount, 10)
        );
    }
    return getNumberOfEachTransactionType({ blockNumber: block.number }).then(
        result => {
            return Promise.all(
                result.map(async resultTx => {
                    const aggTx = (resultTx.get({
                        plain: true
                    }) as unknown) as {
                        type: string;
                        count: string;
                    };
                    let aggTxLogType: LogType | undefined;
                    switch (aggTx.type) {
                        case "mintAsset": {
                            aggTxLogType = LogType.MINT_ASSET_COUNT;
                            break;
                        }
                        case "transferAsset": {
                            aggTxLogType = LogType.TRANSFER_ASSET_COUNT;
                            break;
                        }
                        case "composeAsset": {
                            aggTxLogType = LogType.COMPOSE_ASSET_COUNT;
                            break;
                        }
                        case "decomposeAsset": {
                            aggTxLogType = LogType.DECOMPOSE_ASSET_COUNT;
                            break;
                        }
                        case "setRegularKey": {
                            aggTxLogType = LogType.SET_REGULAR_KEY_COUNT;
                            break;
                        }
                        case "setShardOwners": {
                            aggTxLogType = LogType.SET_SHARD_OWNER_COUNT;
                            break;
                        }
                        case "setShardUsers": {
                            aggTxLogType = LogType.SET_SHARD_USER_COUNT;
                            break;
                        }
                        case "createShard": {
                            aggTxLogType = LogType.CREATE_SHARD_COUNT;
                            break;
                        }
                        case "changeAssetScheme": {
                            aggTxLogType = LogType.CHANGE_ASSET_SCHEME_COUNT;
                            break;
                        }
                        case "increaseAssetSupply": {
                            aggTxLogType = LogType.INCREASE_ASSET_SUPPLY_COUNT;
                            break;
                        }
                        case "remove": {
                            aggTxLogType = LogType.REMOVE_COUNT;
                            break;
                        }
                        case "custom": {
                            aggTxLogType = LogType.CUSTOM_COUNT;
                            break;
                        }
                        case "wrapCCC": {
                            aggTxLogType = LogType.WRAP_CCC_COUNT;
                            break;
                        }
                        case "unwrapCCC": {
                            aggTxLogType = LogType.UNWRAP_CCC_COUNT;
                            break;
                        }
                        default:
                            aggTxLogType = undefined;
                            break;
                    }
                    if (aggTxLogType !== undefined) {
                        await queryLog(
                            isRetracted,
                            dateString,
                            aggTxLogType,
                            parseInt(aggTx.count, 10)
                        );
                    }
                })
            );
        }
    );
}

async function queryLog(
    isRetracted: boolean,
    dateString: string,
    logType: LogType,
    count: number,
    value?: string | null
) {
    if (isRetracted) {
        await LogModel.decreaseLogCount(dateString, logType, count, value);
    } else {
        await LogModel.increaseLogCount(dateString, logType, count, value);
    }
}
