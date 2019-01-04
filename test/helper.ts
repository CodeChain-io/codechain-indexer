import { execFile } from "child_process";
import { SDK } from "codechain-sdk";
import { Transaction } from "codechain-sdk/lib/core/classes";
import { readFileSync, writeFile } from "fs";
import * as path from "path";
import { IndexerConfig } from "../src/config";
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

export const worker = new Worker({ sdk }, options.worker);

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
    const parcel = sdk.core.createAssetTransactionParcel({
        transaction
    });
    const signedParcel = parcel.sign({
        secret: ACCOUNT_SECRET,
        seq: await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS),
        fee: 10
    });
    const parcelHash = await sdk.rpc.chain.sendSignedParcel(signedParcel);
    return {
        parcelHash
    };
};

export const mintAsset = async ({
    metadata,
    amount,
    lockScriptHash,
    approver
}: any) => {
    const assetScheme = sdk.core.createAssetScheme({
        shardId: 0,
        metadata,
        amount,
        approver
    });
    const assetAddress = sdk.core.classes.AssetTransferAddress.fromTypeAndPayload(
        0,
        lockScriptHash,
        {
            networkId: CODECHAIN_NETWORK_ID
        }
    );
    const assetMintTransaction = assetScheme.createMintTransaction({
        recipient: assetAddress
    });
    return {
        ...(await sendTransaction({ transaction: assetMintTransaction })),
        assetMintTransaction
    };
};

export const payment = async (params?: { inc_seq?: number }) => {
    const { inc_seq = 0 } = params || {};
    let seq = await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS);
    for (let i = 0; i < inc_seq; i++) {
        seq += 1;
    }
    const p = sdk.core
        .createPaymentParcel({
            amount: 10,
            recipient: ACCOUNT_ADDRESS
        })
        .sign({
            secret: ACCOUNT_SECRET,
            fee: 10,
            seq
        });
    return await sdk.rpc.chain.sendSignedParcel(p);
};

export const runExample = (name: string) => {
    const originalPath = path.join(
        __dirname,
        "..",
        "node_modules/codechain-sdk/",
        `examples/${name}.js`
    );
    const code = String(readFileSync(originalPath)).replace(
        `require("codechain-sdk")`,
        `require("..")`
    );
    const testPath = path.join(
        __dirname,
        "..",
        "node_modules/codechain-sdk/",
        `examples/test-${name}.js`
    );
    return new Promise((resolve, reject) => {
        writeFile(testPath, code, err => {
            if (err) {
                reject(err);
                return;
            }
            execFile("node", [testPath], error => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    });
};
