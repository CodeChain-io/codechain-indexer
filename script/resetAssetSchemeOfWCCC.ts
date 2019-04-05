import { H160 } from "codechain-primitives/lib";

import models from "../src/models";
import * as AssetSchemeModel from "../src/models/logic/assetscheme";

const networkId: string = process.env.CODECHAIN_NETWORK_ID!;
const shardId: number = parseInt(process.env.CODECHAIN_SHARD_ID!, 10);

if (!Number.isInteger(shardId) || networkId == null) {
    console.error(
        "check env variables CODECHAIN_NETWORK_ID and CODECHAIN_SHARD_ID"
    );
    process.exit();
}

(async () => {
    await models.AssetScheme.findByPk(H160.zero().value).then(
        async instance => {
            if (instance == null) {
                console.error("AssetScheme not found");
                return;
            }
            const { transactionHash } = instance.get();
            await instance.destroy();
            await AssetSchemeModel.createAssetSchemeOfWCCC(
                transactionHash,
                networkId,
                shardId
            );
            console.log("created");
        }
    );
    await models.sequelize.close();
})();
