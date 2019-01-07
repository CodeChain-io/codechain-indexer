import * as _ from "lodash";
import { WorkerContext } from ".";
import { BlockAttribute } from "../models/block";
import * as AccountModel from "../models/logic/account";

export async function updateAccount(
    block: BlockAttribute,
    params: {
        checkingBlockNumber: number;
    },
    context: WorkerContext
) {
    const { sdk } = context;
    const affectedAddresses = new Array<string>();
    if (block.number === 0) {
        const genesisAccounts: string[] = await sdk.rpc.sendRpcRequest(
            "chain_getGenesisAccounts",
            []
        );
        affectedAddresses.push(...genesisAccounts);
        affectedAddresses.push(block.author);
    } else {
        affectedAddresses.push(block.author);
        const transactions = block.transactions!;
        for (const tx of transactions) {
            affectedAddresses.push(tx.signer);
        }
        const payments = transactions.filter(tx => tx.action!.type === "pay");
        payments.map(tx => {
            const action = tx.action!;
            if (action.type === "pay" && tx.invoice) {
                affectedAddresses.push(action.receiver);
            }
        });
    }

    return Promise.all(
        _.uniq(affectedAddresses).map(async affectedAddress => {
            const balance = await sdk.rpc.chain.getBalance(
                affectedAddress,
                params.checkingBlockNumber
            );
            const seq = await sdk.rpc.chain.getSeq(
                affectedAddress,
                params.checkingBlockNumber
            );
            await AccountModel.updateAccountOrCreate(affectedAddress, {
                balance,
                seq
            });
        })
    );
}
