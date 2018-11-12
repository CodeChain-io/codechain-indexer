export const getMappingTransaction = () => {
    const assetTransferInput = {
        properties: {
            unlockScript: {
                properties: {
                    data: {
                        type: "long"
                    },
                    type: {
                        type: "keyword"
                    }
                }
            },
            lockScript: {
                properties: {
                    data: {
                        type: "long"
                    },
                    type: {
                        type: "keyword"
                    }
                }
            },
            timelock: {
                properties: {
                    type: {
                        type: "keyword"
                    },
                    value: {
                        type: "long"
                    }
                }
            },
            prevOut: {
                properties: {
                    amount: {
                        type: "keyword"
                    },
                    assetType: {
                        type: "keyword"
                    },
                    assetScheme: {
                        properties: {
                            metadata: {
                                type: "text"
                            },
                            registrar: {
                                type: "keyword"
                            },
                            amount: {
                                type: "keyword"
                            },
                            networkId: {
                                type: "keyword"
                            }
                        }
                    },
                    index: {
                        type: "long"
                    },
                    owner: {
                        type: "keyword"
                    },
                    transactionHash: {
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
                    }
                }
            }
        }
    };
    return {
        properties: {
            data: {
                properties: {
                    parcelHash: {
                        type: "keyword"
                    },
                    blockNumber: {
                        type: "long"
                    },
                    shardId: {
                        type: "long"
                    },
                    invoice: {
                        type: "boolean"
                    },
                    errorType: {
                        type: "keyword"
                    },
                    parcelIndex: {
                        type: "long"
                    },
                    hash: {
                        type: "keyword"
                    },
                    input: assetTransferInput,
                    inputs: assetTransferInput,
                    burns: assetTransferInput,
                    metadata: {
                        type: "text"
                    },
                    assetName: {
                        type: "keyword"
                    },
                    networkId: {
                        type: "keyword"
                    },
                    output: {
                        properties: {
                            recipient: {
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
                                type: "keyword"
                            },
                            assetType: {
                                type: "keyword"
                            }
                        }
                    },
                    outputs: {
                        properties: {
                            owner: {
                                type: "keyword"
                            },
                            amount: {
                                type: "keyword"
                            },
                            assetType: {
                                type: "keyword"
                            },
                            assetScheme: {
                                properties: {
                                    metadata: {
                                        type: "text"
                                    },
                                    registrar: {
                                        type: "keyword"
                                    },
                                    amount: {
                                        type: "keyword"
                                    },
                                    networkId: {
                                        type: "keyword"
                                    }
                                }
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
                            }
                        }
                    },
                    timestamp: {
                        type: "long"
                    },
                    registrar: {
                        type: "keyword"
                    }
                }
            },
            type: {
                type: "keyword"
            },
            isRetracted: {
                type: "boolean"
            }
        }
    };
};
