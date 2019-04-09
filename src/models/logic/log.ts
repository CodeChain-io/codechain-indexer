import { Transaction } from "sequelize";
import models from "..";
import * as Exception from "../../exception";
import { LogType } from "../log";

export async function increaseLogCount(
    date: string,
    type: LogType,
    count: number,
    options: {
        value?: string | null;
        transaction?: Transaction;
    } = {}
) {
    if (count === 0) {
        return;
    }
    const logInst = await getLog(date, type, options);
    let newCount;
    if (logInst) {
        const currentCount = logInst.get().count;
        newCount = count + currentCount;
    } else {
        newCount = count;
    }
    await updateLog(date, type, newCount, options);
}

export async function decreaseLogCount(
    date: string,
    type: LogType,
    count: number,
    options: {
        value?: string | null;
        transaction?: Transaction;
    } = {}
) {
    if (count === 0) {
        return;
    }
    const logInst = await getLog(date, type, options);
    if (logInst) {
        const currentCount = logInst.get().count;
        const newCount = currentCount - count;
        await updateLog(date, type, newCount, options);
    } else {
        throw Exception.InvalidLogType();
    }
}

async function updateLog(
    date: string,
    type: LogType,
    count: number,
    options: {
        value?: string | null;
        transaction?: Transaction;
    } = {}
) {
    try {
        const { value, transaction } = options;
        await models.Log.upsert(
            {
                id: getLogId(date, type, value),
                date,
                count,
                type,
                value
            },
            { transaction }
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getLog(
    date: string,
    logType: LogType,
    options: {
        value?: string | null;
        transaction?: Transaction;
    } = {}
) {
    try {
        const { value, transaction } = options;
        return await models.Log.findOne({
            where: {
                id: getLogId(date, logType, value)
            },
            transaction
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
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
        throw Exception.DBError();
    }
}

function getLogId(date: string, logType: LogType, value?: string | null) {
    return `${date}-${logType}-${value || "N"}`;
}
