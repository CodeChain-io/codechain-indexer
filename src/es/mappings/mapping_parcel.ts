import { getMappingTransaction } from "./mapping_transaction";

export const getMappingParcel = () => {
    return {
        properties: {
            action: {
                properties: {
                    action: {
                        type: "keyword"
                    },
                    receiver: {
                        type: "keyword"
                    },
                    amount: {
                        type: "keyword"
                    },
                    shardId: {
                        type: "long"
                    },
                    key: {
                        type: "keyword"
                    },
                    owners: {
                        type: "keyword"
                    },
                    users: {
                        type: "keyword"
                    },
                    transaction: getMappingTransaction(),
                    value: {
                        type: "keyword"
                    },
                    invoice: {
                        type: "boolean"
                    },
                    errorType: {
                        type: "keyword"
                    }
                }
            },
            blockHash: {
                type: "keyword"
            },
            signer: {
                type: "keyword"
            },
            timestamp: {
                type: "long"
            },
            countOfTransaction: {
                type: "long"
            },
            blockNumber: {
                type: "long"
            },
            fee: {
                type: "keyword"
            },
            hash: {
                type: "keyword"
            },
            networkId: {
                type: "keyword"
            },
            seq: {
                type: "keyword"
            },
            parcelIndex: {
                type: "long"
            },
            sig: {
                type: "keyword"
            },
            isRetracted: {
                type: "boolean"
            }
        }
    };
};
