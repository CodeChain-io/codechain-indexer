import { PlatformAddress, U64, U64Value } from "codechain-primitives";
import { SDK } from "codechain-sdk";
import { SignedTransaction } from "codechain-sdk/lib/core/classes";
import { getCCSHolders, getUndelegatedCCS } from "codechain-stakeholder-sdk";
import * as _ from "lodash";
import { Transaction } from "sequelize";
import { BlockAttribute } from "../models/block";
import { CCCChangeInstance } from "../models/cccChanges";
import * as BlockModel from "../models/logic/block";
import * as CCCChangeModel from "../models/logic/cccChange";
import { getDelegation } from "./commonFeeDistribution";

const rlp = require("rlp");

export type CommonParams = {
    maxExtraDataSize: number;
    maxAssetSchemeMetadataSize: number;
    maxTransferMetadataSize: number;
    maxTextContentSize: number;
    networkID: string;
    minPayCost: number;
    minSetRegularKeyCost: number;
    minCreateShardCost: number;
    minSetShardOwnersCost: number;
    minSetShardUsersCost: number;
    minWrapCccCost: number;
    minCustomCost: number;
    minStoreCost: number;
    minRemoveCost: number;
    minMintAssetCost: number;
    minTransferAssetCost: number;
    minChangeAssetSchemeCost: number;
    minIncreaseAssetSupplyCost: number;
    minComposeAssetCost: number;
    minDecomposeAssetCost: number;
    minUnwrapCccCost: number;
    maxBodySize: number;
    snapshotPeriod: number;
    termSeconds?: number | null;
    nominationExpiration?: number | null;
    custodyPeriod?: number | null;
    releasePeriod?: number | null;
    maxNumOfValidators?: number | null;
    minNumOfValidators?: number | null;
    delegationThreshold?: number | null;
    minDeposit?: number | null;
};

export type MinimumFees = {
    [param: string]: number;
};

// This is unsafe. Please use when you are confident that it is safe.
function U64ValueToNumber(value: U64Value) {
    return parseInt(U64.ensure(value).toString(10), 10);
}

export async function getCommonParams(
    sdk: SDK,
    blockNumber: number
): Promise<CommonParams> {
    const result = await sdk.rpc.sendRpcRequest("chain_getCommonParams", [
        blockNumber
    ]);

    try {
        return {
            maxExtraDataSize: U64ValueToNumber(result.maxExtraDataSize),
            maxAssetSchemeMetadataSize: U64ValueToNumber(
                result.maxAssetSchemeMetadataSize
            ),
            maxTransferMetadataSize: U64ValueToNumber(
                result.maxTransferMetadataSize
            ),
            maxTextContentSize: U64ValueToNumber(result.maxTextContentSize),
            networkID: result.networkID,
            minPayCost: U64ValueToNumber(result.minPayCost),
            minSetRegularKeyCost: U64ValueToNumber(result.minSetRegularKeyCost),
            minCreateShardCost: U64ValueToNumber(result.minCreateShardCost),
            minSetShardOwnersCost: U64ValueToNumber(
                result.minSetShardOwnersCost
            ),
            minSetShardUsersCost: U64ValueToNumber(result.minSetShardUsersCost),
            minWrapCccCost: U64ValueToNumber(result.minWrapCccCost),
            minCustomCost: U64ValueToNumber(result.minCustomCost),
            minStoreCost: U64ValueToNumber(result.minStoreCost),
            minRemoveCost: U64ValueToNumber(result.minRemoveCost),
            minMintAssetCost: U64ValueToNumber(result.minMintAssetCost),
            minTransferAssetCost: U64ValueToNumber(result.minTransferAssetCost),
            minChangeAssetSchemeCost: U64ValueToNumber(
                result.minChangeAssetSchemeCost
            ),
            minIncreaseAssetSupplyCost: U64ValueToNumber(
                result.minIncreaseAssetSupplyCost
            ),
            minComposeAssetCost: U64ValueToNumber(result.minComposeAssetCost),
            minDecomposeAssetCost: U64ValueToNumber(
                result.minDecomposeAssetCost
            ),
            minUnwrapCccCost: U64ValueToNumber(result.minUnwrapCccCost),
            maxBodySize: U64ValueToNumber(result.maxBodySize),
            snapshotPeriod: U64ValueToNumber(result.snapshotPeriod),
            termSeconds:
                result.termSeconds == null
                    ? null
                    : U64ValueToNumber(result.termSeconds),
            nominationExpiration:
                result.nominationExpiration == null
                    ? null
                    : U64ValueToNumber(result.nominationExpiration),
            custodyPeriod:
                result.custodyPeriod == null
                    ? null
                    : U64ValueToNumber(result.custodyPeriod),
            releasePeriod:
                result.releasePeriod == null
                    ? null
                    : U64ValueToNumber(result.releasePeriod),
            maxNumOfValidators:
                result.maxNumOfValidators == null
                    ? null
                    : U64ValueToNumber(result.maxNumOfValidators),
            minNumOfValidators:
                result.minNumOfValidators == null
                    ? null
                    : U64ValueToNumber(result.minNumOfValidators),
            delegationThreshold:
                result.delegationThreshold == null
                    ? null
                    : U64ValueToNumber(result.delegationThreshold),
            minDeposit:
                result.minDeposit == null
                    ? null
                    : U64ValueToNumber(result.minDeposit)
        };
    } catch (e) {
        throw new Error(
            `Expected chain_getCommonParams to return JSON of CommonParams, but an error occured: ${e.toString()}`
        );
    }
}

export function getMinimumFees(params: CommonParams): MinimumFees {
    return {
        pay: params.minPayCost,
        setRegularKey: params.minSetRegularKeyCost,
        createShard: params.minCreateShardCost,
        setShardOwners: params.minSetShardOwnersCost,
        setShardUsers: params.minSetShardUsersCost,
        wrapCCC: params.minWrapCccCost,
        custom: params.minCustomCost,
        store: params.minStoreCost,
        remove: params.minRemoveCost,
        mintAsset: params.minMintAssetCost,
        transferAsset: params.minTransferAssetCost,
        changeAssetScheme: params.minChangeAssetSchemeCost,
        increaseAssetSupply: params.minIncreaseAssetSupplyCost,
        composeAsset: params.minComposeAssetCost,
        decomposeAsset: params.minDecomposeAssetCost,
        unwrapCCC: params.minUnwrapCccCost
    };
}

export async function distributeFee(
    sdk: SDK,
    commonParams: CommonParams,
    blockNumber: number,
    miningReward: U64,
    transactions: SignedTransaction[],
    transaction: Transaction
): Promise<any[]> {
    const stakeHolders =
        sdk.networkId === "tc" ? [] : await getCCSHolders(sdk, blockNumber);
    const stakeBalances: [PlatformAddress, U64][] = await Promise.all(
        stakeHolders.map(
            async holder =>
                [
                    holder,
                    (await getDelegation(sdk, holder, blockNumber)).reduce(
                        U64.plus,
                        await getUndelegatedCCS(sdk, holder, blockNumber)
                    )
                ] as [PlatformAddress, U64]
        )
    );
    const totalMinFee = new U64(
        (await Promise.all(
            transactions.map(async tx => {
                const fee = await minFee(tx.unsigned.type(), commonParams);
                if (fee == null) {
                    throw Error(
                        `No min fee for ${tx.unsigned.type()} on : ${blockNumber}`
                    );
                }
                return fee;
            })
        )).reduce((a, b) => a + b, 0)
    );
    const totalStake = stakeBalances.reduce(
        (sum, balance) => sum.plus(balance[1]),
        new U64(0)
    );
    let distributed = new U64(0);
    const queries: Promise<any>[] = [];
    if (totalStake.isGreaterThan(0)) {
        for (const [holder, weight] of stakeBalances) {
            const fraction = totalMinFee.times(weight).idiv(totalStake);
            if (fraction.isEqualTo(0)) {
                continue;
            }
            distributed = distributed.plus(fraction);
            queries.push(
                CCCChangeModel.stakeReward(
                    {
                        address: holder.value,
                        change: fraction,
                        blockNumber
                    },
                    { transaction }
                )
            );
        }
    }
    const change = miningReward.minus(distributed);
    if (change.isEqualTo(0)) {
        return Promise.all(queries);
    }

    queries.push(
        BlockModel.setIntermediateRewards(change, blockNumber, {
            transaction
        })
    );

    return Promise.all(queries);
}

function minFee(
    transactionType: string,
    commonParams: CommonParams
): Promise<number | null> {
    return Promise.resolve(MINIMUM_FEES[transactionType](commonParams));
}

const MINIMUM_FEES: { [param: string]: (params: CommonParams) => number } = {
    pay: params => params.minPayCost,
    setRegularKey: params => params.minSetRegularKeyCost,
    setShardOwners: params => params.minSetShardOwnersCost,
    setShardUsers: params => params.minSetShardUsersCost,
    wrapCCC: params => params.minWrapCccCost,
    custom: params => params.minCustomCost,
    store: params => params.minStoreCost,
    remove: params => params.minRemoveCost,
    mintAsset: params => params.minMintAssetCost,
    transferAsset: params => params.minTransferAssetCost,
    changeAssetScheme: params => params.minChangeAssetSchemeCost,
    increaseAssetSupply: params => params.minIncreaseAssetSupplyCost,
    unwrapCCC: params => params.minUnwrapCccCost
};

export async function applyPenalty({
    sdk,
    currentBlockNumber,
    termBlocks,
    nextTermStartBlock,
    termStartBlockNumber,
    termEndBlockNumber,
    validators
}: {
    sdk: SDK;
    currentBlockNumber: number;
    termBlocks: BlockAttribute[];
    nextTermStartBlock: BlockAttribute;
    termStartBlockNumber: number;
    termEndBlockNumber: number;
    validators: string[];
}): Promise<{
    authorRewards: Map<string, U64>;
    penaltyAmount: U64;
}> {
    const originRewards = collectAuthorRewardsFromBlocks(termBlocks);
    const authorRewards = new Map(originRewards);

    let penaltyAmount = new U64(0);

    const bannedAccounts = await getAccountsInState(
        sdk,
        AccountState.Banned,
        currentBlockNumber
    );
    {
        for (const bannedAccount of bannedAccounts) {
            if (authorRewards.get(bannedAccount)) {
                penaltyAmount = penaltyAmount.plus(
                    authorRewards.get(bannedAccount)!
                );
                authorRewards.delete(bannedAccount);
            }
        }
    }

    const notVoted: { [index: string]: number } = calculateNotVoted([
        ...termBlocks.slice(1),
        nextTermStartBlock
    ]);

    for (const validator of validators) {
        const reward = authorRewards.get(validator) || new U64(0);
        const reduced = calculatePunishment(
            notVoted[validator] || 0,
            termEndBlockNumber - termStartBlockNumber + 1,
            reward
        );
        authorRewards.set(validator, reward.minus(reduced));
        penaltyAmount = penaltyAmount.plus(reduced);
    }

    return {
        authorRewards,
        penaltyAmount
    };
}

function calculatePunishment(
    notVotedCnt: number,
    totalCnt: number,
    reward: U64
) {
    const x = reward.times(notVotedCnt);
    if (notVotedCnt * 3 <= totalCnt) {
        // 0.3 * x
        return x.times(3).idiv(10 * totalCnt);
    } else if (notVotedCnt * 2 <= totalCnt) {
        // 4.8 * x - 1.5
        return x
            .times(48)
            .minus(reward.times(15 * totalCnt))
            .idiv(10 * totalCnt);
    } else if (notVotedCnt * 3 <= 2 * totalCnt) {
        // 0.6 * x + 0.6
        return x
            .times(6)
            .plus(reward.times(6 * totalCnt))
            .idiv(10 * totalCnt);
    } else {
        return reward;
    }
}

function calculateNotVoted(blocks: BlockAttribute[]) {
    const result: { [index: string]: number } = {};
    for (const block of blocks) {
        for (const notVotedValidator of block.missedSignersOfPrev) {
            if (result[notVotedValidator]) {
                result[notVotedValidator] += 1;
            } else {
                result[notVotedValidator] = 1;
            }
        }
    }
    return result;
}

function collectAuthorRewardsFromBlocks(
    blocks: BlockAttribute[]
): Map<string, U64> {
    const rewards: Map<string, U64> = new Map();
    for (const block of blocks) {
        if (rewards.get(block.author)) {
            rewards.set(
                block.author,
                new U64(block.intermediateRewards).plus(
                    rewards.get(block.author)!
                )
            );
        } else {
            rewards.set(block.author, new U64(block.intermediateRewards));
        }
    }
    return rewards;
}

export function decodePlatformAddressfromPubkey(
    buffer: Buffer,
    networkId: string
): PlatformAddress {
    const pubkey = buffer.toString("hex");
    return PlatformAddress.fromPublic(pubkey, {
        networkId
    });
}

export function decodePlatformAddress(
    buffer: Buffer,
    networkId: string
): PlatformAddress {
    const accountId = buffer.toString("hex");
    return PlatformAddress.fromAccountId(accountId, {
        networkId
    });
}

function decodeValidatorsState(
    decoded: Buffer[][],
    networkId: string
): string[] {
    return decoded.map(([, , , pubkey]) => {
        return decodePlatformAddressfromPubkey(pubkey, networkId).toString();
    });
}

function decodeCandidatesState(
    decoded: Buffer[][],
    networkId: string
): string[] {
    return decoded.map(([pubkey, ,]) => {
        return decodePlatformAddressfromPubkey(pubkey, networkId).toString();
    });
}

function decodeJailedState(decoded: Buffer[][], networkId: string): string[] {
    return decoded.map(([address, , ,]) => {
        return decodePlatformAddress(address, networkId).toString();
    });
}

function decodeBannedState(decoded: Buffer[], networkId: string): string[] {
    return decoded.map(buf => decodePlatformAddress(buf, networkId).toString());
}

function statesToDecoder(
    state: QueryableStates
):
    | ((decoded: Buffer[], networkId: string) => string[])
    | ((decoded: Buffer[][], networkId: string) => string[]) {
    switch (state) {
        case AccountState.Banned:
            return decodeBannedState;
        case AccountState.Candidate:
            return decodeCandidatesState;
        case AccountState.Validator:
            return decodeValidatorsState;
        case AccountState.Jailed:
            return decodeJailedState;
    }
}

export async function getAccountsInState(
    sdk: SDK,
    state: QueryableStates,
    blockNumber: number
): Promise<string[]> {
    const queryString = statesToString(state);
    const data = await sdk.rpc.engine.getCustomActionData(
        2,
        [queryString],
        blockNumber
    );
    if (data == null) {
        return [];
    }
    const decoder = statesToDecoder(state);
    const decoded = rlp.decode(Buffer.from(data, "hex"));
    return decoder(decoded, sdk.networkId);
}
export enum AccountState {
    Eligible,
    Candidate,
    Validator,
    Banned,
    Jailed
}

type QueryableStates = Exclude<AccountState, AccountState.Eligible>;

function statesToString(state: AccountState) {
    switch (state) {
        case AccountState.Banned:
            return "Banned";
        case AccountState.Candidate:
            return "Candidates";
        case AccountState.Jailed:
            return "Jailed";
        case AccountState.Validator:
            return "Validators";
        case AccountState.Eligible:
            return "Eligible";
    }
}

export async function giveValidatorRewards({
    rewards,
    nextTermEndBlockNumber,
    transaction
}: {
    rewards: Map<string, U64>;
    nextTermEndBlockNumber: number;
    transaction: Transaction;
}): Promise<CCCChangeInstance[]> {
    const queries: Promise<CCCChangeInstance>[] = [];

    for (const [address, amount] of rewards) {
        if (amount.eq(0)) {
            continue;
        }
        queries.push(
            CCCChangeModel.validatorReward(
                {
                    address,
                    change: amount,
                    blockNumber: nextTermEndBlockNumber
                },
                { transaction }
            )
        );
    }

    return Promise.all(queries);
}

export function distributePenalty({
    penaltyAmount,
    termBlocks,
    validators
}: {
    penaltyAmount: U64;
    termBlocks: BlockAttribute[];
    validators: string[];
}): Map<string, U64> {
    const allMissed: { [index: string]: number } = calculateMissedVotes(
        termBlocks
    );

    const allProposed: { [index: string]: number } = calculateProposed(
        termBlocks
    );

    // validators grouped by score.
    const groups: Map<number, string[]> = new Map();
    for (const validator of validators) {
        const missed = allMissed[validator] || 0;
        const proposed = allProposed[validator] || 0;
        if (proposed !== 0) {
            const ratio = missed / proposed;
            const group = groups.get(ratio);
            if (group) {
                group.push(validator);
            } else {
                groups.set(ratio, [validator]);
            }
        }
    }

    const sortedGroups = Array.from(groups)
        .sort(([keyA], [keyB]) => {
            return keyA - keyB;
        })
        .map(([, addresses]) => addresses);

    let remainReward = penaltyAmount;
    const resultReward: Map<string, U64> = new Map();
    for (const group of sortedGroups) {
        const reward = remainReward.idiv(group.length + 1);
        if (reward.eq(0)) {
            break;
        }

        for (const validator of group) {
            resultReward.set(validator, reward);
            remainReward = remainReward.minus(reward);
        }
    }

    return resultReward;
}

function calculateMissedVotes(termBlocks: BlockAttribute[]) {
    const result: { [index: string]: number } = {};
    for (const block of termBlocks) {
        if (result[block.author]) {
            result[block.author] += block.missedSignersOfPrev.length;
        } else {
            result[block.author] = block.missedSignersOfPrev.length;
        }
    }

    return result;
}

function calculateProposed(termBlocks: BlockAttribute[]) {
    const result: { [index: string]: number } = {};
    for (const block of termBlocks) {
        if (result[block.author]) {
            result[block.author] += 1;
        } else {
            result[block.author] = 0;
        }
    }
    return result;
}
