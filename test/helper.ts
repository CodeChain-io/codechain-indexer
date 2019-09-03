import { exec, execFile } from "child_process";
import { SDK } from "codechain-sdk";
import { Block, H256, Transaction, U64 } from "codechain-sdk/lib/core/classes";
import { readFileSync, writeFile } from "fs";
import * as path from "path";
import { NullSlack } from "../src/checker/slack";
import { IndexerConfig } from "../src/config";
import * as BlockModel from "../src/models/logic/block";
import Worker from "../src/worker";

process.env.NODE_ENV = "test";

process.on("unhandledRejection", () => {
    // unhandle global rejection
});

const options = require("config") as IndexerConfig;
export const CODECHAIN_NETWORK_ID = options.codechain.networkId;
export const SERVER_URL = options.codechain.host;
export const sdk = new SDK({
    server: SERVER_URL,
    keyStoreType: "memory",
    networkId: CODECHAIN_NETWORK_ID
});

export const worker = new Worker(
    { sdk, slack: new NullSlack() },
    options.worker
);

export const ACCOUNT_SECRET =
    process.env.ACCOUNT_SECRET ||
    "ede1d4ccb4ec9a8bbbae9a13db3f4a7b56ea04189be86ac3a6a439d9a0a1addd";
export const ACCOUNT_ID =
    process.env.ACCOUNT_ID ||
    sdk.util.getAccountIdFromPrivate(ACCOUNT_SECRET).toString(); // "0x6fe64ffa3a46c074226457c90ccb32dc06ccced1"
export const ACCOUNT_ADDRESS =
    process.env.ACCOUNT_ADDRESS ||
    sdk.core.classes.PlatformAddress.fromAccountId(ACCOUNT_ID, {
        networkId: CODECHAIN_NETWORK_ID
    }).toString(); // "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd"
export const ACCOUNT_PASSPHRASE = process.env.ACCOUNT_PASSPHRASE || "satoshi";

export const sendTransaction = async ({
    transaction
}: {
    transaction: Transaction;
}) => {
    const signed = transaction.sign({
        secret: ACCOUNT_SECRET,
        seq: await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS),
        fee: 10
    });
    const hash = await sdk.rpc.chain.sendSignedTransaction(signed);
    return {
        hash
    };
};

export const sendTransactionAndGetBlock = async (
    transaction: Transaction
): Promise<{ transactionHash: H256; block: Block }> => {
    const { hash: transactionHash } = await sendTransaction({ transaction });
    const block = await sdk.rpc.chain.getBlock(
        await sdk.rpc.chain.getBestBlockNumber()
    );
    return { transactionHash, block: block! };
};

export const mintAsset = async () => {
    const scheme = sdk.core.createAssetScheme({
        shardId: 0,
        // NOTE: The random number prevents a conflict of assetType
        metadata: "" + Math.random(),
        supply: 1
    });
    const recipient = await sdk.key.createAssetAddress();
    const transaction = sdk.core.createMintAssetTransaction({
        scheme,
        recipient
    });
    const { transactionHash, block } = await sendTransactionAndGetBlock(
        transaction
    );
    await BlockModel.createBlock(block, sdk, new U64(1));
    return { transactionHash, block, transaction };
};

export const pay = async (params?: { inc_seq?: number }) => {
    const { inc_seq = 0 } = params || {};
    const seq = (await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS))! + inc_seq;
    const signed = sdk.core
        .createPayTransaction({
            quantity: 10,
            recipient: ACCOUNT_ADDRESS
        })
        .sign({
            secret: ACCOUNT_SECRET,
            fee: 10,
            seq
        });
    return await sdk.rpc.chain.sendSignedTransaction(signed);
};

export const runExample = (name: string) => {
    const originalPath = path.join(__dirname, `sdk-examples/${name}.js`);
    const code = String(readFileSync(originalPath));
    const testPath = path.join(__dirname, `sdk-examples/test-${name}.js`);
    return new Promise((resolve, reject) => {
        writeFile(testPath, code, err => {
            if (err) {
                reject(err);
                return;
            }
            execFile("node", [testPath], (error, _stdout, stderr) => {
                if (stderr) {
                    console.error(stderr);
                }
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    });
};

export const resetDb = () => {
    return new Promise((resolve, reject) => {
        exec("yarn run drop", err => {
            if (err) {
                console.error(`Cannot drop a database: ${err}`);
            }
            exec("yarn run migrate", err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    });
};
