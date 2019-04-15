import { SDK } from "codechain-sdk";

import models from "../src/models";

async function main() {
    const sdk = new SDK({ server: "http://localhost:8080", networkId: "cc" });

    await models.Account.findAll({
        attributes: ["address", "balance", "seq"]
    }).then(async accounts => {
        console.log(`Total # of accounts: ${accounts.length}`);

        let counter = 0;
        let countOfWrongBalance = 0;
        let countOfWrongSeq = 0;
        let countOfWrongAccount = 0;
        for (const account of accounts) {
            const { address, balance, seq } = account.get();
            const update: { balance?: string; seq?: number } = {};

            let flag = false;

            const getBalanceResult = await sdk.rpc.chain.getBalance(address);
            if (balance !== getBalanceResult.toString()) {
                countOfWrongBalance++;
                update.balance = getBalanceResult.toString();
                flag = true;
            }

            const getSeqResult = await sdk.rpc.chain.getSeq(address);
            if (seq !== getSeqResult) {
                countOfWrongSeq++;
                update.seq = getSeqResult;
                flag = true;
            }

            if (flag) {
                countOfWrongAccount++;
                await account.update(update);
            }

            counter++;
            if (counter % 500 === 0) {
                console.log(`counter: ${counter}`);
                console.log(`# of wrong balance: ${countOfWrongBalance}`);
                console.log(`# of wrong seq: ${countOfWrongSeq}`);
                console.log(`# of wrong account: ${countOfWrongAccount}`);
            }
        }

        console.log("========================================");
        console.log(`# of wrong balance: ${countOfWrongBalance}`);
        console.log(`# of wrong seq: ${countOfWrongSeq}`);
        console.log(`# of wrong account: ${countOfWrongAccount}`);
    });
}

main()
    .catch(console.error)
    .finally(() => models.sequelize.close());
