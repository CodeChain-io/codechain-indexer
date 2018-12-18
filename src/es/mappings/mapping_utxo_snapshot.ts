export const getUTXOSnapshotMapping = () => {
    return {
        properties: {
            blockNumber: "long",
            utxoList: {
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
                    }
                }
            }
        }
    };
};
