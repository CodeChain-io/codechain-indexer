import { Client } from "elasticsearch";
import { ElasticSearchAgent } from "..";
import { getAccountMapping } from "../mappings/mapping_account";
import { getAssetMapping } from "../mappings/mapping_asset";
import { getMappingBlock } from "../mappings/mapping_block";
import { getMappingImageBlob } from "../mappings/mapping_image_blob";
import { getMappingLog } from "../mappings/mapping_log";
import { getMappingParcel } from "../mappings/mapping_parcel";
import { getMappingPendingParcel } from "../mappings/mapping_pending_parcel";
import { getMappingTransaction } from "../mappings/mapping_transaction";
import { BaseAction } from "./BaseAction";

export class QueryIndex implements BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;

    public async checkIndexOrCreate(): Promise<void> {
        const isMappingBlockExisted = await this.client.indices.exists({
            index: "block"
        });
        const isMappingParcelExisted = await this.client.indices.exists({
            index: "parcel"
        });
        const isMappingTransactionExisted = await this.client.indices.exists({
            index: "transaction"
        });
        const isMappingPendingParcelExisted = await this.client.indices.exists({
            index: "pending_parcel"
        });
        const isMappingLogExisted = await this.client.indices.exists({
            index: "log"
        });
        const isMappingAccountExisted = await this.client.indices.exists({
            index: "account"
        });
        const isMappingImageBlobExisted = await this.client.indices.exists({
            index: "image_blob"
        });
        const isMappingAssetExisted = await this.client.indices.exists({
            index: "asset"
        });
        if (!isMappingBlockExisted) {
            await this.client.indices.create({
                index: "block"
            });
            await this.client.indices.putMapping({
                index: "block",
                type: "_doc",
                body: getMappingBlock()
            });
        }
        if (!isMappingParcelExisted) {
            await this.client.indices.create({
                index: "parcel"
            });
            await this.client.indices.putMapping({
                index: "parcel",
                type: "_doc",
                body: getMappingParcel()
            });
        }
        if (!isMappingTransactionExisted) {
            await this.client.indices.create({
                index: "transaction"
            });
            await this.client.indices.putMapping({
                index: "transaction",
                type: "_doc",
                body: getMappingTransaction()
            });
        }
        if (!isMappingPendingParcelExisted) {
            await this.client.indices.create({
                index: "pending_parcel"
            });
            await this.client.indices.putMapping({
                index: "pending_parcel",
                type: "_doc",
                body: getMappingPendingParcel()
            });
        }
        if (!isMappingLogExisted) {
            await this.client.indices.create({
                index: "log"
            });
            await this.client.indices.putMapping({
                index: "log",
                type: "_doc",
                body: getMappingLog()
            });
        }
        if (!isMappingAccountExisted) {
            await this.client.indices.create({
                index: "account"
            });
            await this.client.indices.putMapping({
                index: "account",
                type: "_doc",
                body: getAccountMapping()
            });
        }
        if (!isMappingImageBlobExisted) {
            await this.client.indices.create({
                index: "image_blob"
            });
            await this.client.indices.putMapping({
                index: "image_blob",
                type: "_doc",
                body: getMappingImageBlob()
            });
        }
        if (!isMappingAssetExisted) {
            await this.client.indices.create({
                index: "asset"
            });
            await this.client.indices.putMapping({
                index: "asset",
                type: "_doc",
                body: getAssetMapping()
            });
        }
    }
}
