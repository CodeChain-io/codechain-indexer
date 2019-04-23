const SDK = require("codechain-sdk");

const sdk = new SDK({
    server: process.env.CODECHAIN_RPC_HTTP || "http://localhost:8080",
    networkId: process.env.CODECHAIN_NETWORK_ID || "tc"
});

const ACCOUNT_ADDRESS =
    process.env.ACCOUNT_ADDRESS ||
    "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";
const ACCOUNT_PASSPHRASE = process.env.ACCOUNT_PASSPHRASE || "satoshi";

(async () => {
    const shardId = 0;
    const aliceAddress = await sdk.key.createAssetAddress();
    const bobAddress = "tcaqyqckq0zgdxgpck6tjdg4qmp52p2vx3qaexqnegylk";

    // Create asset named Gold. Total supply of Gold is 10000. The approver is set
    // to null, which means this type of asset can be transferred freely.
    const goldAssetScheme = sdk.core.createAssetScheme({
        shardId,
        metadata: {
            name: "Gold",
            description: "An asset example",
            icon_url: "https://gold.image/",
            seed: Math.floor(Math.random().toString() * 10000),
            created_at: new Date().toISOString()
        },
        supply: 10000,
        approver: null
    });
    const mintTx = sdk.core.createMintAssetTransaction({
        scheme: goldAssetScheme,
        recipient: aliceAddress
    });

    const firstGold = mintTx.getMintedAsset();
    const transferTx = sdk.core
        .createTransferAssetTransaction()
        .addInputs(firstGold)
        .addOutputs(
            {
                recipient: bobAddress,
                quantity: 3000,
                assetType: firstGold.assetType,
                shardId
            },
            {
                recipient: aliceAddress,
                quantity: 7000,
                assetType: firstGold.assetType,
                shardId
            }
        );
    await sdk.key.signTransactionInput(transferTx, 0);

    const mintHash = await sdk.rpc.chain.sendTransaction(mintTx, {
        account: ACCOUNT_ADDRESS,
        passphrase: ACCOUNT_PASSPHRASE
    });

    const mintError = await sdk.rpc.chain.getErrorHint(mintHash);
    if (mintError != null) {
        throw Error(`AssetMintTransaction failed: ${mintError}`);
    }
    if ((await sdk.rpc.chain.getTransaction(mintHash)) == null) {
        throw Error(`Mint transaction ${mintHash.value} failed`);
    }

    const transferHash = await sdk.rpc.chain.sendTransaction(transferTx, {
        account: ACCOUNT_ADDRESS,
        passphrase: ACCOUNT_PASSPHRASE
    });
    const transferError = await sdk.rpc.chain.getErrorHint(transferHash);
    if (transferError != null) {
        throw Error(`AssetTransferTransaction failed: ${transferError}`);
    }
    if ((await sdk.rpc.chain.getTransaction(transferHash)) == null) {
        throw Error(`Transfer transaction ${transferHash.value} failed`);
    }

    // Unspent Bob's 3000 golds
    console.log(await sdk.rpc.chain.getAsset(transferTx.tracker(), 0, shardId));
    // Unspent Alice's 7000 golds
    console.log(await sdk.rpc.chain.getAsset(transferTx.tracker(), 1, shardId));
})().catch(err => {
    console.error(`Error:`, err);
});
