import { SDK } from "codechain-sdk";
import * as BlockModel from "../models/logic/block";
import * as CCCChangeModel from "../models/logic/cccChange";

export async function run(sdk: SDK) {
    console.log("Start to check CCCChanges");
    const prevBlockInstance = await BlockModel.getLatestBlock();
    let lastCheckedBlockNumber: number | "NotExist";
    if (prevBlockInstance) {
        lastCheckedBlockNumber = prevBlockInstance.get({ plain: true }).number;
    } else {
        lastCheckedBlockNumber = "NotExist";
    }
    for (;;) {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        if (lastCheckedBlockNumber === "NotExist") {
            const blockInstance = await BlockModel.getByNumber(0);
            if (blockInstance === null) {
                continue;
            } else {
                lastCheckedBlockNumber = -1;
                continue;
            }
        }

        const latestBlock = (await BlockModel.getLatestBlock())!;
        const latestBlockNumber: number = latestBlock.get("number");

        const checkFrom = lastCheckedBlockNumber + 1;
        const checkTo = latestBlockNumber - 1;
        if (checkTo > checkFrom) {
            await checkBlocks(checkFrom, checkTo, sdk);
            lastCheckedBlockNumber = checkTo;
        } else {
            continue;
        }
    }
}

async function checkBlocks(
    fromBlockNumber: number,
    toBlockNumber: number,
    sdk: SDK
) {
    if (fromBlockNumber >= toBlockNumber) {
        throw new Error(
            `Invalid fromBlockNumber(${fromBlockNumber}) and toBlockNumber(${toBlockNumber})`
        );
    }

    let beforeBlockNumber = fromBlockNumber;
    let afterBlockNumber = fromBlockNumber + 1;

    for (;;) {
        const cccChanges = (await CCCChangeModel.getByBlockNumber(
            afterBlockNumber
        )).map(instance => instance.get({ plain: true }));

        const balanceChangeMap: Map<string, number> = new Map();
        cccChanges.forEach(cccChange => {
            /// Total CCC does not exceed Number.MAX_SAFE_INTEGER;
            const change = parseInt(cccChange.change, 10);
            const address = cccChange.address;

            if (balanceChangeMap.has(cccChange.address)) {
                balanceChangeMap.set(
                    address,
                    balanceChangeMap.get(address)! + change
                );
            } else {
                balanceChangeMap.set(address, change);
            }
        });

        const promises = Array.from(balanceChangeMap).map(
            async ([address, change]) => {
                const beforeBalanceUInt = await sdk.rpc.chain.getBalance(
                    address,
                    beforeBlockNumber
                );
                const afterBalanceUInt = await sdk.rpc.chain.getBalance(
                    address,
                    afterBlockNumber
                );

                const beforeBalance = parseInt(
                    beforeBalanceUInt.toString(10),
                    10
                );
                const afterBalance = parseInt(
                    afterBalanceUInt.toString(10),
                    10
                );
                const expected = afterBalance - beforeBalance;
                const actual = change;

                if (actual !== expected) {
                    /// TODO Send an email.
                    console.group("Mismatch found");
                    console.error(`Address: ${address}`);
                    console.error(
                        `Balance at ${beforeBlockNumber}: ${beforeBalance}`
                    );
                    console.error(
                        `Balance at ${afterBlockNumber}: ${afterBalance}`
                    );
                    console.error(`Actual CCCChanges: ${actual}`);
                    console.error(`Exepcted CCCChanges: ${expected}`);
                    console.groupEnd();
                }
            }
        );

        await Promise.all(promises);
        if (afterBlockNumber === toBlockNumber) {
            return;
        }
        beforeBlockNumber += 1;
        afterBlockNumber += 1;
    }
}
