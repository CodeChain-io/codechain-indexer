import { getCCSHolders } from "codechain-stakeholder-sdk";
import * as _ from "lodash";
import { Transaction } from "sequelize";

import { WorkerContext } from ".";
import models from "../models";
import { BlockAttribute } from "../models/block";
import * as AccountModel from "../models/logic/account";

export async function updateAccount(
    block: BlockAttribute,
    params: {
        checkingBlockNumber: number;
    },
    context: WorkerContext,
    options: {
        transaction?: Transaction;
    } = {}
) {
    const { transaction } = options;
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
        affectedAddresses.push(
            ...(await models.AddressLog.findAll({
                attributes: ["address"],
                where: {
                    blockNumber: block.number
                },
                transaction
            }).then(instances =>
                instances
                    .map(i => i.get().address)
                    .filter(address => address.charAt(2) === "c")
            )),
            ...(sdk.networkId === "tc"
                ? []
                : await getCCSHolders(sdk as any, block.number)
            ).map(p => p.toString())
        );
    }

    return Promise.all(
        _.uniq(affectedAddresses).map(async affectedAddress => {
            const [balance, seq] = await Promise.all([
                sdk.rpc.chain.getBalance(
                    affectedAddress,
                    params.checkingBlockNumber
                ),
                sdk.rpc.chain.getSeq(
                    affectedAddress,
                    params.checkingBlockNumber
                )
            ]);
            await AccountModel.updateAccountOrCreate(
                affectedAddress,
                {
                    balance,
                    seq
                },
                { transaction }
            );
        })
    );
}
