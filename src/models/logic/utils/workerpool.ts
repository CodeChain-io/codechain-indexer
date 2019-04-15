import {
    PlatformAddress,
    SignedTransaction
} from "codechain-sdk/lib/core/classes";
import { blake160, recoverEcdsa } from "codechain-sdk/lib/utils";
import * as _ from "lodash";
import * as workerpool from "workerpool";
import { getApprovals, getTracker } from "./transaction";

const getSignersFromSignatures = (
    txs: { signature: string; message: string }[],
    networkId: string
) => {
    // tslint:disable:no-shadowed-variable
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

// FIXME: Utilize multicore
export const getApprovers = async (
    txs: SignedTransaction[]
): Promise<(string[] | null)[]> => {
    return txs.map(tx => {
        const networkId = tx.unsigned.networkId();
        const approvals = getApprovals(tx);
        if (approvals != null) {
            const tracker = getTracker(tx)!;
            return approvals.map(approval => {
                const accountId = blake160(recoverEcdsa(tracker, approval));
                return PlatformAddress.fromAccountId(accountId, {
                    networkId
                }).toString();
            });
        } else {
            return null;
        }
    });
};
