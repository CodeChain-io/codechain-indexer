import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as workerpool from "workerpool";

const getSignersFromSignatures = (
    txs: { signature: string; message: string }[],
    networkId: string
) => {
    const { recoverEcdsa, blake160 } = require("codechain-sdk/lib/utils");
    const { PlatformAddress } = require("codechain-sdk/lib/core/classes");
    return txs.map(tx => {
        const { message, signature } = tx;
        const accountId = blake160(recoverEcdsa(message, signature));
        return PlatformAddress.fromAccountId(accountId, {
            networkId
        }).toString();
    });
};

export const getSigners = async (
    txs: SignedTransaction[]
): Promise<string[]> => {
    if (txs.length < 400) {
        // NOTE: Don't create workerpool when there is a small number of transactions.
        return txs.map(tx =>
            tx
                .getSignerAddress({
                    networkId: tx.unsigned.networkId()
                })
                .toString()
        );
    }

    const pool = workerpool.pool({
        nodeWorker: "auto"
    } as any);
    const signer = await Promise.all(
        _.chunk(txs, 100).map(chunk => {
            return pool.exec(getSignersFromSignatures, [
                chunk.map(tx => ({
                    signature: tx.signature(),
                    message: tx.unsigned.unsignedHash().toString()
                })),
                chunk[0].unsigned.networkId()
            ]);
        })
    ).then(chunks => _.flatten(chunks));
    // FIXME: Check if we need to await the terminate().
    pool.terminate();
    return signer;
};
