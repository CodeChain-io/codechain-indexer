import { AssetTransferAddress, H160 } from "codechain-sdk/lib/core/classes";

const P2PKH = "5f5960a7bca6ceeeb0c97bc717562914e7a1de04";
const P2PKHBURN = "37572bdcc22d39a59c0d12d301f6271ba3fdd451";

export function getOwner(
    lockScriptHash: H160,
    parameters: Buffer[],
    networkId: string
) {
    let owner = "";
    if (lockScriptHash.value === P2PKH) {
        owner = AssetTransferAddress.fromTypeAndPayload(
            1,
            new H160(Buffer.from(parameters[0]).toString("hex")),
            {
                networkId
            }
        ).value;
    } else if (lockScriptHash.value === P2PKHBURN) {
        owner = AssetTransferAddress.fromTypeAndPayload(
            2,
            new H160(Buffer.from(parameters[0]).toString("hex")),
            {
                networkId
            }
        ).value;
    } else if (parameters.length === 0) {
        owner = AssetTransferAddress.fromTypeAndPayload(0, lockScriptHash, {
            networkId
        }).value;
    }
    return owner;
}
