import { PlatformAddress, U64 } from "codechain-primitives/lib";
import { SDK } from "codechain-sdk";
import {
    getBanned,
    getCandidates,
    getJailed,
    getTermMetadata
} from "codechain-stakeholder-sdk";

interface BecomeEligible {
    address: PlatformAddress;
    deposit: U64;
}

export async function getBecomeEligible(
    sdk: SDK,
    blockNumber: number
): Promise<BecomeEligible[]> {
    const termMetadata = await getTermMetadata(sdk, blockNumber);
    if (
        !termMetadata ||
        termMetadata.lastTermFinishedBlockNumber === 0 ||
        termMetadata.lastTermFinishedBlockNumber !== blockNumber
    ) {
        return [];
    }

    const result: BecomeEligible[] = [];

    const currentCandidateOrJailedOrBanned = new Set([
        ...(await getCandidates(sdk, blockNumber)).map(
            ({ pubkey }) =>
                PlatformAddress.fromPublic(pubkey, { networkId: sdk.networkId })
                    .value
        ),
        ...(await getJailed(sdk, blockNumber)).map(
            ({ address }) => address.value
        ),
        ...(await getBanned(sdk, blockNumber)).map(address => address.value)
    ]);

    // candidates -> eligible
    const previousCandidates = await getCandidates(sdk, blockNumber - 1);
    for (const { pubkey, deposit } of previousCandidates) {
        const address = PlatformAddress.fromPublic(pubkey, {
            networkId: sdk.networkId
        });
        if (currentCandidateOrJailedOrBanned.has(address.value)) {
            continue;
        }
        if (deposit.gt(0)) {
            result.push({
                address,
                deposit
            });
        }
    }

    // jailed -> eligible
    const previousJailed = await getJailed(sdk, blockNumber - 1);
    for (const { address, deposit } of previousJailed) {
        if (currentCandidateOrJailedOrBanned.has(address.value)) {
            continue;
        }
        if (deposit.gt(0)) {
            result.push({
                address,
                deposit
            });
        }
    }
    return result;
}
