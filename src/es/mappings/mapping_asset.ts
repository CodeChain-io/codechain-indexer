export const getAssetMapping = () => {
    return {
        properties: {
            address: {
                type: "keyword"
            },
            asset: {
                properties: {
                    assetType: {
                        type: "keyword"
                    },
                    lockScriptHash: {
                        type: "keyword"
                    },
                    parameters: {
                        properties: {
                            data: {
                                type: "long"
                            },
                            type: {
                                type: "keyword"
                            }
                        }
                    },
                    amount: {
                        type: "long"
                    },
                    transactionHash: {
                        type: "keyword"
                    },
                    transactionOutputIndex: {
                        type: "long"
                    }
                }
            },
            blockNumber: {
                type: "long"
            },
            parcelIndex: {
                type: "long"
            },
            transactionIndex: {
                type: "long"
            },
            isRemoved: {
                type: "boolean"
            }
        }
    };
};
