import * as _ from "lodash";
import * as moment from "moment";
import * as LogModel from "../../src/models/logic/log";
import { BlockAttribute } from "../models/block";
import { LogType } from "../models/log";

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
    // FIXME: queryLog for each tx action
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
