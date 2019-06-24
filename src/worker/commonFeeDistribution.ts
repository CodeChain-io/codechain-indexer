import { SDK } from "codechain-sdk";
import { PlatformAddress, U64 } from "codechain-sdk/lib/core/classes";

const rlp = require("rlp");

export async function getDelegation(
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
