import models from "..";
import * as Exception from "../../exception";
import { LogType } from "../log";

export async function increaseLogCount(
    date: string,
    type: LogType,
    count: number,
    value?: string | null
) {
    if (count === 0) {
        return;
    }
    const logInst = await getLog(date, type, value);
    let newCount;
    if (logInst) {
        const currentCount = logInst.get().count;
        newCount = count + currentCount;
    } else {
        newCount = count;
    }
    await updateLog(date, type, newCount, value);
}

export async function decreaseLogCount(
    date: string,
    type: LogType,
    count: number,
    value?: string | null
) {
    if (count === 0) {
        return;
    }
    const logInst = await getLog(date, type, value);
    if (logInst) {
        const currentCount = logInst.get().count;
        const newCount = currentCount - count;
        await updateLog(date, type, newCount, value);
    } else {
        throw Exception.InvalidLogType;
    }
}

async function updateLog(
    date: string,
    type: LogType,
    count: number,
    value?: string | null
) {
    try {
        await models.Log.upsert({
            id: getLogId(date, type, value),
            date,
            count,
            type,
            value
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getLog(
    date: string,
    logType: LogType,
    value?: string | null
) {
    try {
        return await models.Log.findOne({
            where: {
                id: getLogId(date, logType, value)
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

export async function getMiningCountLogs(date: string, limit: number) {
    try {
        return await models.Log.findAll({
            where: {
                date,
                type: LogType.BLOCK_MINING_COUNT
            },
            order: [["count", "DESC"]],
            limit
        }).then(logs => logs.map(log => log.get({ plain: true })));
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

function getLogId(date: string, logType: LogType, value?: string | null) {
    return `${date}-${logType}-${value || "N"}`;
}
