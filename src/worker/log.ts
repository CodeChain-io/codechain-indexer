import * as _ from "lodash";
import * as moment from "moment";
import * as LogModel from "../../src/models/logic/log";
import * as Type from "../../src/models/logic/utils/type";
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
    const parcelCount = block.parcels!.length;
    if (parcelCount > 0) {
        await queryLog(
            isRetracted,
            dateString,
            LogType.PARCEL_COUNT,
            parcelCount
        );
        const paymentParcelCount = _.filter(
            block.parcels,
            p => p.action!.action === "payment"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.PARCEL_PAYMENT_COUNT,
            paymentParcelCount
        );
        const setRegularKeyParcelCount = _.filter(
            block.parcels,
            p => p.action!.action === "setRegularKey"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.PARCEL_SET_REGULAR_KEY_COUNT,
            setRegularKeyParcelCount
        );
        const assetTransactionGroupParcelCount = _.filter(
            block.parcels,
            p => p.action!.action === "assetTransaction"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.PARCEL_ASSET_TRANSACTION_COUNT,
            assetTransactionGroupParcelCount
        );
        const setShardOwnersParcelCount = _.filter(
            block.parcels,
            p => p.action!.action === "setShardOwners"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.PARCEL_SET_SHARD_OWNER_COUNT,
            setShardOwnersParcelCount
        );
        const setShardUserParcelCount = _.filter(
            block.parcels,
            p => p.action!.action === "setShardUsers"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.PARCEL_SET_SHARD_USER_COUNT,
            setShardUserParcelCount
        );
        const createShardParcelCount = _.filter(
            block.parcels,
            p => p.action!.action === "createShard"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.PARCEL_CREATE_SHARD_COUNT,
            createShardParcelCount
        );

        const transactions = Type.getTransactions(block);
        const txCount = transactions.length;
        if (txCount) {
            await queryLog(isRetracted, dateString, LogType.TX_COUNT, txCount);
            const assetMintTxCount = _.filter(
                transactions,
                tx => tx!.type === "assetMint"
            ).length;
            await queryLog(
                isRetracted,
                dateString,
                LogType.TX_ASSET_MINT_COUNT,
                assetMintTxCount
            );
            const assetTransferTxCount = _.filter(
                transactions,
                tx => tx!.type === "assetTransfer"
            ).length;
            await queryLog(
                isRetracted,
                dateString,
                LogType.TX_ASSET_TRANSFER_COUNT,
                assetTransferTxCount
            );
            const assetComposeTxCount = _.filter(
                transactions,
                tx => tx!.type === "assetCompose"
            ).length;
            await queryLog(
                isRetracted,
                dateString,
                LogType.TX_ASSET_COMPOSE_COUNT,
                assetComposeTxCount
            );
            const assetDecomposeTxCount = _.filter(
                transactions,
                tx => tx!.type === "assetDecompose"
            ).length;
            await queryLog(
                isRetracted,
                dateString,
                LogType.TX_ASSET_DECOMPOSE_COUNT,
                assetDecomposeTxCount
            );
        }
    }
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
