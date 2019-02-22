import { H160 } from "codechain-sdk/lib/core/classes";
import { InvalidTransaction } from "../../../exception";
import { AssetSchemeAttribute } from "../../assetscheme";
import { getByAssetType } from "../assetscheme";

export function getAssetName(metadata: string): string | undefined {
    try {
        return JSON.parse(metadata).name;
    } catch (e) {
        return undefined;
    }
}

export async function getAssetScheme(
    assetType: H160
): Promise<AssetSchemeAttribute> {
    const assetSchemeInstance = await getByAssetType(assetType);
    if (!assetSchemeInstance) {
        throw InvalidTransaction();
    }
    return assetSchemeInstance.get({
        plain: true
    });
}
