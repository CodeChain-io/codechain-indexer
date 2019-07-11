import { SDK } from "codechain-sdk";
import { IndexerConfig } from "../config";
import * as BlockModel from "../models/logic/block";
import * as CCCChangeModel from "../models/logic/cccChange";
import { createEmail, Email } from "./email";
import { createSlack, Slack } from "./slack";

export async function run(sdk: SDK, options: IndexerConfig) {
    console.log("Start to check CCCChanges");
    const prevBlockInstance = await BlockModel.getLatestBlock();
    let lastCheckedBlockNumber: number | "NotExist";

    const email = createEmail({
        tag: `[${options.codechain.networkId}][indexer-cccchanges-checker]`,
        sendgridApiKey: process.env.SENDGRID_API_KEY,
        to: process.env.SENDGRID_TO
    });

    const slack = createSlack(
        `[${options.codechain.networkId}][indexer-cccchanges-checker]`,
        process.env.SLACK_WEBHOOK
    );

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
            await checkBlocks(checkFrom, checkTo, sdk, email, slack);
            lastCheckedBlockNumber = checkTo;
        } else {
            continue;
        }
    }
}

async function checkBlocks(
    fromBlockNumber: number,
    toBlockNumber: number,
    sdk: SDK,
    email: Email,
    slack: Slack
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
                    sendAlarm({
                        address,
                        beforeBlockNumber,
                        afterBlockNumber,
                        beforeBalance,
                        afterBalance,
                        actual,
                        expected,
                        email,
                        slack
                    });
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

function sendAlarm({
    address,
    beforeBlockNumber,
    afterBlockNumber,
    actual,
    expected,
    beforeBalance,
    afterBalance,
    email,
    slack
}: {
    address: string;
    beforeBlockNumber: number;
    afterBlockNumber: number;
    actual: number;
    expected: number;
    beforeBalance: number;
    afterBalance: number;
    email: Email;
    slack: Slack;
}) {
    /// TODO Send an email.
    const firstLine = "Mismatch found";
    console.group(firstLine);

    const lines = [
        `Address: ${address}`,
        `Balance at ${beforeBlockNumber}: ${beforeBalance}`,
        `Balance at ${afterBlockNumber}: ${afterBalance}`,
        `Actual CCCChanges: ${actual}`,
        `Exepcted CCCChanges: ${expected}`
    ];
    lines.forEach(line => {
        console.error(line);
    });
    console.groupEnd();

    email.sendError(`
    <p>${firstLine}</p>
    <ul>
    ${lines.map(line => `<li>${line}</li>`).join("\n")}
    </ul>
    `);

    slack.sendError([firstLine, ...lines].join("\n"));
}
