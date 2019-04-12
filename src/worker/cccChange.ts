import { SDK } from "codechain-sdk";
import {
    Block,
    H512,
    PlatformAddress,
    SignedTransaction,
    U64,
    UnwrapCCC
} from "codechain-sdk/lib/core/classes";
import { getCCSBalance, getCCSHolders } from "codechain-stakeholder-sdk";
import { Transaction } from "sequelize";
import { CCCChangeInstance } from "../models/cccChanges";
import * as CCCChangeModel from "../models/logic/cccChange";

const rlp = require("rlp");

export async function updateCCCChange(
    sdk: SDK,
    block: Block,
    miningReward: U64,
    transaction: Transaction
): Promise<void> {
    if (block.number === 0) {
        await initialDistribute(sdk, transaction);
        return;
    }

    const queries = [];
    queries.push(
        distributeFee(
            sdk,
            block.number,
            block.author,
            miningReward,
            block.transactions,
            transaction
        )
    );
    queries.push(payFee(sdk, block.number, block.transactions, transaction));
    queries.push(
        trackBalanceChangeByTx(
            sdk,
            block.number,
            block.transactions,
            transaction
        )
    );
    await Promise.all(queries);
}

async function initialDistribute(
    sdk: SDK,
    transaction: Transaction
): Promise<(CCCChangeInstance | undefined)[]> {
    const accounts = await sdk.rpc.chain.getGenesisAccounts();
    return Promise.all(
        accounts.map(async account => {
            const change = await sdk.rpc.chain.getBalance(account, 0);
            if (change.isEqualTo(0)) {
                return;
            }
            return CCCChangeModel.initialDistribute(
                { address: account.value, change, blockNumber: 0 },
                { transaction }
            );
        })
    );
}

async function distributeFee(
    sdk: SDK,
    blockNumber: number,
    blockAuthor: PlatformAddress,
    miningReward: U64,
    transactions: SignedTransaction[],
    transaction: Transaction
): Promise<(CCCChangeInstance | undefined)[]> {
    const stakeHolders =
        sdk.networkId === "tc"
            ? []
            : await getCCSHolders(sdk as any, blockNumber);
    const stakeBalances: [PlatformAddress, U64][] = await Promise.all(
        stakeHolders.map(
            async holder =>
                [
                    holder,
                    (await getDelegation(
                        sdk as any,
                        holder,
                        blockNumber
                    )).reduce(
                        U64.plus,
                        await getCCSBalance(sdk as any, holder, blockNumber)
                    )
                ] as [PlatformAddress, U64]
        )
    );
    const totalMinFee = new U64(
        (await Promise.all(
            transactions.map(async tx => {
                const fee = await minFee(sdk, tx.unsigned.type(), blockNumber);
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
    const queries = [];
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
    const change = miningReward.minus(distributed);
    if (change.isEqualTo(0)) {
        return Promise.all(queries);
    }
    queries.push(
        CCCChangeModel.blockReward(
            {
                address: blockAuthor.value,
                change,
                blockNumber
            },
            { transaction }
        )
    );
    return Promise.all(queries);
}

const MINIMUM_FEES: { [param: string]: Promise<number | null> } = {};

function minFee(
    sdk: SDK,
    transactionType: string,
    blockNumber: number
): Promise<number | null> {
    // FIXME: This code assumes that minimum fees are same in all blocks, but it can be changed per block.
    if (MINIMUM_FEES[transactionType] == null) {
        MINIMUM_FEES[transactionType] = sdk.rpc.chain.getMinTransactionFee(
            transactionType,
            blockNumber
        );
    }
    return MINIMUM_FEES[transactionType];
}

async function getDelegation(
    sdk: SDK,
    delegator: PlatformAddress,
    blockNumber: number
): Promise<U64[]> {
    const data = await sdk.rpc.engine.getCustomActionData(
        2,
        ["Delegation", delegator.accountId.toEncodeObject()],
        blockNumber
    );
    if (data == null) {
        return [];
    }
    const list: Buffer[][] = rlp.decode(Buffer.from(data, "hex"));
    return list.map(
        ([_, quantity]) => new U64(`0x${quantity.toString("hex")}`)
    );
}

async function getFeePayer(
    sdk: SDK,
    signerPublic: H512,
    blockNumber: number
): Promise<PlatformAddress> {
    const owner = await sdk.rpc.chain.getRegularKeyOwner(
        signerPublic,
        blockNumber
    );
    return owner == null
        ? PlatformAddress.fromPublic(signerPublic, { networkId: sdk.networkId })
        : owner;
}

async function payFee(
    sdk: SDK,
    blockNumber: number,
    transactions: SignedTransaction[],
    transaction: Transaction
): Promise<(CCCChangeInstance | undefined)[]> {
    const queries = [];
    for (const tx of transactions) {
        const signerPublic = tx.getSignerPublic();
        const address = (await getFeePayer(sdk, signerPublic, blockNumber))
            .value;
        const transactionHash = tx.hash().value;
        const change = tx.unsigned.fee()!;
        if (change.isEqualTo(0)) {
            continue;
        }
        queries.push(
            CCCChangeModel.payFee(
                {
                    address,
                    transactionHash,
                    change,
                    blockNumber
                },
                { transaction }
            )
        );
    }
    return Promise.all(queries);
}

async function trackBalanceChangeByTx(
    sdk: SDK,
    blockNumber: number,
    transactions: SignedTransaction[],
    transaction: Transaction
): Promise<(CCCChangeInstance | undefined)[]> {
    const queries = [];
    for (const tx of transactions) {
        const transactionHash = tx.hash().value;
        switch (tx.unsigned.type()) {
            case "pay": {
                const pay = tx.unsigned as any;
                const receiver = pay.receiver.value;
                const change = pay.quantity;
                const sender = (await getFeePayer(
                    sdk,
                    tx.getSignerPublic(),
                    blockNumber
                )).value;
                if (receiver === sender) {
                    continue;
                }

                queries.push(
                    CCCChangeModel.changeByTx(
                        {
                            address: sender,
                            change,
                            blockNumber,
                            transactionHash,
                            isNegative: true
                        },
                        { transaction }
                    )
                );
                queries.push(
                    CCCChangeModel.changeByTx(
                        {
                            address: receiver,
                            change,
                            blockNumber,
                            transactionHash,
                            isNegative: false
                        },
                        { transaction }
                    )
                );
                break;
            }
            case "wrapCCC": {
                const receiver = (await getFeePayer(
                    sdk,
                    tx.getSignerPublic(),
                    blockNumber
                )).value;
                const wrap = tx.unsigned as any;
                const change = wrap.quantity;
                queries.push(
                    CCCChangeModel.changeByTx(
                        {
                            address: receiver,
                            change,
                            blockNumber,
                            transactionHash,
                            isNegative: true
                        },
                        { transaction }
                    )
                );
                break;
            }
            case "unwrapCCC": {
                const receiver = (await getFeePayer(
                    sdk,
                    tx.getSignerPublic(),
                    blockNumber
                )).value;
                const unwrap = tx.unsigned as UnwrapCCC;
                const change = unwrap.burn(0)!.prevOut.quantity;
                queries.push(
                    CCCChangeModel.changeByTx(
                        {
                            address: receiver,
                            change,
                            blockNumber,
                            transactionHash,
                            isNegative: false
                        },
                        { transaction }
                    )
                );
                break;
            }
            default:
                break;
        }
    }
    return Promise.all(queries);
}
