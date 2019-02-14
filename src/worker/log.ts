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
    const txCount = block.transactions!.length;
    if (txCount > 0) {
        await queryLog(isRetracted, dateString, LogType.TX_COUNT, txCount);

        const mintAssetCount = _.filter(
            block.transactions,
            tx => tx!.type === "mintAsset"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.MINT_ASSET_COUNT,
            mintAssetCount
        );
        const assetTransferTxCount = _.filter(
            block.transactions,
            tx => tx!.type === "transferAsset"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.TRANSFER_ASSET_COUNT,
            assetTransferTxCount
        );
        const assetComposeTxCount = _.filter(
            block.transactions,
            tx => tx!.type === "composeAsset"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.COMPOSE_ASSET_COUNT,
            assetComposeTxCount
        );
        const assetDecomposeTxCount = _.filter(
            block.transactions,
            tx => tx!.type === "decomposeAsset"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.DECOMPOSE_ASSET_COUNT,
            assetDecomposeTxCount
        );

        const payCount = _.filter(block.transactions, p => p.type === "pay")
            .length;
        await queryLog(isRetracted, dateString, LogType.PAY_COUNT, payCount);
        const setRegularKeyCount = _.filter(
            block.transactions,
            p => p.type === "setRegularKey"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.SET_REGULAR_KEY_COUNT,
            setRegularKeyCount
        );
        const setShardOwnersCount = _.filter(
            block.transactions,
            p => p.type === "setShardOwners"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.SET_SHARD_OWNER_COUNT,
            setShardOwnersCount
        );
        const setShardUserCount = _.filter(
            block.transactions,
            p => p.type === "setShardUsers"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.SET_SHARD_USER_COUNT,
            setShardUserCount
        );
        const createShardCount = _.filter(
            block.transactions,
            p => p.type === "createShard"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.CREATE_SHARD_COUNT,
            createShardCount
        );

        const ChangeAssetSchemeCount = _.filter(
            block.transactions,
            p => p.type === "changeAssetScheme"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.CHANGE_ASSET_SCHEME_COUNT,
            ChangeAssetSchemeCount
        );

        const storeCount = _.filter(block.transactions, p => p.type === "store")
            .length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.STORE_COUNT,
            storeCount
        );

        const removeCount = _.filter(
            block.transactions,
            p => p.type === "remove"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.REMOVE_COUNT,
            removeCount
        );

        const customCount = _.filter(
            block.transactions,
            p => p.type === "custom"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.CUSTOM_COUNT,
            customCount
        );

        const wrapCCCCount = _.filter(
            block.transactions,
            p => p.type === "wrapCCC"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.WRAP_CCC_COUNT,
            wrapCCCCount
        );

        const unwrapCCCCount = _.filter(
            block.transactions,
            p => p.type === "unwrapCCC"
        ).length;
        await queryLog(
            isRetracted,
            dateString,
            LogType.UNWRAP_CCC_COUNT,
            unwrapCCCCount
        );

        if (txCount) {
            await queryLog(isRetracted, dateString, LogType.TX_COUNT, txCount);
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
