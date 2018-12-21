import * as _ from "lodash";
import { WorkerContext } from ".";
import { BlockAttribute } from "../models/block";
import * as AccountModel from "../models/logic/account";

export async function updateAccount(
    block: BlockAttribute,
    options: {
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
    }
    affectedAddresses.push(block.author);
    const parcels = block.parcels!;
    for (const parcel of parcels) {
        affectedAddresses.push(parcel.signer);
    }
    const paymentParcels = parcels.filter(
        parcel => parcel.action!.action === "payment"
    );
    paymentParcels.map(parcel => {
        const paymentAction = parcel.action!;
        if (paymentAction.action === "payment" && paymentAction.invoice) {
            affectedAddresses.push(paymentAction.receiver);
        }
    });

    return Promise.all(
        _.uniq(affectedAddresses).map(async affectedAddress => {
            const balance = await sdk.rpc.chain.getBalance(
                affectedAddress,
                options.checkingBlockNumber
            );
            const seq = await sdk.rpc.chain.getSeq(
                affectedAddress,
                options.checkingBlockNumber
            );
            await AccountModel.updateAccountOrCreate(affectedAddress, {
                balance,
                seq
            });
        })
    );
}
