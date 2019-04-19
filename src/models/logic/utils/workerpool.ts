import {
    PlatformAddress,
    SignedTransaction
} from "codechain-sdk/lib/core/classes";
import { blake160, recoverEcdsa } from "codechain-sdk/lib/utils";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as workerpool from "workerpool";
import { getRegularKeyOwnerByPublicKey } from "../transaction";
import { getApprovals, getTracker } from "./transaction";

/* istanbul ignore next */
const getSignerPublicsFromSignatures = (
    txs: { signature: string; message: string }[]
): string[] => {
    // tslint:disable:no-shadowed-variable
    const { recoverEcdsa } = require("codechain-sdk/lib/utils");
    return txs.map(tx => recoverEcdsa(tx.message, tx.signature));
};

/* istanbul ignore next */
const getSignersFromPubKeyAndRegularKeyOwner = (
    params: { signerPubKey: string; regularKeyOwner: string }[],
    networkId: string
): string[] => {
    // tslint:disable:no-shadowed-variable
    const { PlatformAddress } = require("codechain-sdk/lib/core/classes");
    return params.map(param => {
        const { signerPubKey, regularKeyOwner } = param;
        if (regularKeyOwner != null) {
            return regularKeyOwner;
        }

        return PlatformAddress.fromPublic(signerPubKey, networkId);
    });
};

export const getSigners = async (
    txs: SignedTransaction[],
    options: { transaction?: Sequelize.Transaction }
): Promise<string[]> => {
    if (txs.length < 400) {
        // NOTE: Don't create workerpool when there is a small number of transactions.
        return Promise.all(
            txs.map(async tx => {
                const pubKey = tx.getSignerPublic().value;
                const regularKeyOwner = await getRegularKeyOwnerByPublicKey(
                    pubKey,
                    options
                );
                if (regularKeyOwner != null) {
                    return regularKeyOwner;
                }
                return PlatformAddress.fromPublic(pubKey, {
                    networkId: tx.unsigned.networkId()
                }).toString();
            })
        );
    }

    const pool = workerpool.pool({
        nodeWorker: "auto"
    } as any);
    const networkId = txs[0].unsigned.networkId();
    const signatureAndMessages = txs.map(tx => ({
        signature: tx.signature(),
        message: tx.unsigned.unsignedHash().toString()
    }));
    const signerPubKeys: string[][] = (await workerpool.Promise.all(
        _.chunk(signatureAndMessages, 100).map(chunk => {
            return pool.exec(getSignerPublicsFromSignatures, [chunk]);
        })
    )) as any;
    const regularKeyOwnerAndPubKeys: [
        string | null,
        string
    ][][] = await Promise.all(
        signerPubKeys.map(async (signerPubKey: string[]) => {
            return Promise.all(
                signerPubKey.map(
                    async (
                        signerPubKey: string
                    ): Promise<[string | null, string]> => {
                        const regularKeyOwner = await getRegularKeyOwnerByPublicKey(
                            signerPubKey,
                            options
                        );
                        return [regularKeyOwner, signerPubKey];
                    }
                )
            );
        })
    );

    const chunks: string[][] = (await workerpool.Promise.all(
        regularKeyOwnerAndPubKeys.map(
            (
                chunk: [string | null, string][]
            ): workerpool.Promise<string[][]> => {
                return pool.exec(getSignersFromPubKeyAndRegularKeyOwner, [
                    chunk.map(([regularKeyOwner, signerPubKey]) => {
                        return {
                            regularKeyOwner,
                            signerPubKey
                        };
                    }),
                    networkId
                ]);
            }
        )
    )) as any; // The bug of workerpool type definition
    const signers = _.flatten(chunks);
    // FIXME: Check if we need to await the terminate().
    pool.terminate();
    return signers;
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
