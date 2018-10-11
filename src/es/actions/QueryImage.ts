import { H256 } from "codechain-sdk/lib/core/classes";
import { Client, DeleteDocumentResponse, SearchResponse } from "elasticsearch";
import * as _ from "lodash";
import { ElasticSearchAgent } from "..";
import { BaseAction } from "./BaseAction";

export class QueryImage implements BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;

    public async getAssetImageBlob(assetType: H256): Promise<string | null> {
        return this.searchImage({
            size: 1,
            query: {
                term: {
                    _id: assetType.value
                }
            }
        }).then((response: SearchResponse<{ blob: string }>) => {
            if (response.hits.total === 0) {
                return null;
            }
            return response.hits.hits[0]._source.blob;
        });
    }

    public async indexImage(assetType: H256, imageBlob: string): Promise<any> {
        return this.client.index({
            index: "image_blob",
            type: "_doc",
            id: assetType.value,
            body: {
                blob: imageBlob
            }
        });
    }

    public async removeImage(assetType: H256): Promise<DeleteDocumentResponse> {
        return this.client.delete({
            index: "image_blob",
            type: "_doc",
            id: assetType.value
        });
    }

    public async searchImage(body: any): Promise<SearchResponse<any>> {
        return this.client.search({
            index: "image_blob",
            type: "_doc",
            body
        });
    }
}
