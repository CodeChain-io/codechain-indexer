import { SDK } from "codechain-sdk";
import { Block, U64 } from "codechain-sdk/lib/core/classes";
import { Transaction } from "sequelize";
import { BlockAttribute } from "../models/block";
import * as BlockModel from "../models/logic/block";
import * as CCCChangeModel from "../models/logic/cccChange";
import { getBecomeEligible } from "../models/logic/utils/custom";
import * as dynamicFeeDistribution from "./dynamicFeeDistribution";
import * as staticFeeDistribution from "./staticFeeDistribution";

export async function updateCCCChange(
    sdk: SDK,
    block: Block,
    parentBlock: BlockAttribute | "ParentOfGenesis",
    miningReward: U64,
    transaction: Transaction
): Promise<void> {
    if (block.number === 0) {
        await staticFeeDistribution.initialDistribute(sdk, transaction);
        return;
    }

    const commonParams = await dynamicFeeDistribution.getCommonParams(
        sdk,
        block.number - 1
    );

    // When a block closes a term, the current term from "chain_getTermMetadata" is changed to the next term.
    // To get the "real" current term of the block, we use the parent block number.
    const [, currentTerm] = await sdk.rpc.sendRpcRequest(
        "chain_getTermMetadata",
        [block.number - 1]
    );

    if (currentTerm === 0) {
        const queries = [];
        queries.push(
            staticFeeDistribution.distributeFee(
                sdk,
                block.number,
                block.author,
                miningReward,
                block.transactions,
                transaction
            )
        );
        queries.push(
            staticFeeDistribution.payFee(
                sdk,
                block.number,
                block.transactions,
                transaction
            )
        );
        queries.push(
            staticFeeDistribution.trackBalanceChangeByTx(
                sdk,
                block.number,
                block.transactions,
                transaction
            )
        );
        await Promise.all(queries);
    } else {
        // When using the dynamic validator, the block can not be the genesis block;
        const parent = parentBlock as BlockAttribute;

        const currentBlockTermIndicator = Math.floor(
            block.timestamp / commonParams.termSeconds!
        );
        const parentBlockTermIndicator = Math.floor(
            parent.timestamp / commonParams.termSeconds!
        );

        const queries: Promise<any>[] = [];
        queries.push(
            dynamicFeeDistribution.distributeFee(
                sdk,
                commonParams,
                block.number,
                miningReward,
                block.transactions,
                transaction
            )
        );

        queries.push(
            staticFeeDistribution.payFee(
                sdk,
                block.number,
                block.transactions,
                transaction
            )
        );
        queries.push(
            staticFeeDistribution.trackBalanceChangeByTx(
                sdk,
                block.number,
                block.transactions,
                transaction
            )
        );

        const isLastBlockInTerm =
            currentBlockTermIndicator !== parentBlockTermIndicator;
        if (!isLastBlockInTerm) {
            await Promise.all(queries);
            return;
        }

        const [
            prevTermEndBlockNumber,
            currentTermID
        ] = await sdk.rpc.sendRpcRequest("chain_getTermMetadata", [
            block.number - 1
        ]);

        // If the `block` is the closing block of the term 0, currentTermID is 1.
        if (currentTermID <= 1) {
            await Promise.all(queries);
            return;
        }

        const [prevPrevTermEndBlockNumber] = await sdk.rpc.sendRpcRequest(
            "chain_getTermMetadata",
            [prevTermEndBlockNumber - 1]
        );

        const allBlocks = (await BlockModel.getBlocksByNumber(
            prevPrevTermEndBlockNumber + 1,
            prevTermEndBlockNumber + 1
        )).map(blockInst => blockInst.get({ plain: true }));

        const [termBlocks, nextTermStartBlock] = [
            allBlocks.slice(0, allBlocks.length - 1),
            allBlocks.slice(-1)[0]
        ];

        const validators = await sdk.rpc.sendRpcRequest(
            "chain_getPossibleAuthors",
            [prevTermEndBlockNumber]
        );

        const {
            authorRewards,
            penaltyAmount
        } = await dynamicFeeDistribution.applyPenalty({
            sdk,
            currentBlockNumber: block.number,
            termBlocks,
            nextTermStartBlock,
            termStartBlockNumber: prevPrevTermEndBlockNumber + 1,
            termEndBlockNumber: prevTermEndBlockNumber,
            validators
        });

        const penaltyDistributionResult = dynamicFeeDistribution.distributePenalty(
            {
                penaltyAmount,
                termBlocks,
                validators
            }
        );

        const totalValidatorReward = mergeRewards(
            authorRewards,
            penaltyDistributionResult
        );

        queries.push(
            dynamicFeeDistribution.giveValidatorRewards({
                rewards: totalValidatorReward,
                nextTermEndBlockNumber: block.number,
                transaction
            })
        );

        const becomeEligibles = await getBecomeEligible(sdk, block.number);

        queries.push(
            Promise.all(
                becomeEligibles.map(({ address, deposit }) =>
                    CCCChangeModel.stakeDeposit(
                        {
                            address: address.value,
                            change: deposit,
                            isNegative: false,
                            blockNumber: block.number
                        },
                        {
                            transaction
                        }
                    )
                )
            )
        );

        await Promise.all(queries);
    }
}

function mergeRewards(a: Map<string, U64>, b: Map<string, U64>) {
    const result: Map<string, U64> = new Map();

    for (const [address, reward] of a) {
        result.set(address, reward);
    }

    for (const [address, reward] of b) {
        if (result.get(address)) {
            result.set(address, result.get(address)!.plus(reward));
        } else {
            result.set(address, reward);
        }
    }
    return result;
}
