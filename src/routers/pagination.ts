import * as Sequelize from "sequelize";

export function createPaginationResult<Row>(params: {
    query: {
        firstEvaluatedKey?: any[] | null;
        lastEvaluatedKey?: any[] | null;
    };
    rows: Row[];
    getEvaluatedKey: (row: Row) => string;
    itemsPerPage: number;
}) {
    const { query, itemsPerPage, getEvaluatedKey } = params;
    let { rows } = params;

    const firstQuery = !query.firstEvaluatedKey && !query.lastEvaluatedKey;
    const order: "forward" | "reverse" = queryOrder(query);

    if (order === "reverse") {
        rows = rows.reverse();
    }

    const hasMorePage = rows.length > itemsPerPage;
    if (hasMorePage) {
        if (order === "forward") {
            rows.pop();
        } else if (order === "reverse") {
            rows.shift();
        }
    }

    let hasNextPage;
    let hasPreviousPage;
    if (firstQuery) {
        hasPreviousPage = false;
        hasNextPage = hasMorePage;
    } else if (order === "forward") {
        hasPreviousPage = true;
        hasNextPage = hasMorePage;
    } else if (order === "reverse") {
        hasPreviousPage = hasMorePage;
        hasNextPage = true;
    } else {
        throw new Error("Unreachable");
    }

    const firstRow = rows[0];
    const lastRow = rows[rows.length - 1];
    return {
        data: rows,
        hasNextPage,
        hasPreviousPage,
        firstEvaluatedKey: firstRow ? getEvaluatedKey(firstRow) : null,
        lastEvaluatedKey: lastRow ? getEvaluatedKey(lastRow) : null
    };
}

function queryOrder(params: {
    firstEvaluatedKey?: number[] | null;
    lastEvaluatedKey?: number[] | null;
}): "reverse" | "forward" {
    if (params.firstEvaluatedKey && params.lastEvaluatedKey) {
        throw new Error("Unreachable");
    }
    return params.firstEvaluatedKey ? "reverse" : "forward";
}

export const utxoPagination = {
    forwardOrder: [
        ["blockNumber", "DESC"],
        ["transactionIndex", "DESC"],
        ["transactionOutputIndex", "DESC"]
    ],
    reverseOrder: [
        ["blockNumber", "ASC"],
        ["transactionIndex", "ASC"],
        ["transactionOutputIndex", "ASC"]
    ],
    orderby: (params: {
        firstEvaluatedKey?: number[] | null;
        lastEvaluatedKey?: number[] | null;
    }) => {
        const order = queryOrder(params);
        if (order === "forward") {
            return utxoPagination.forwardOrder;
        } else if (order === "reverse") {
            return utxoPagination.reverseOrder;
        }
    },
    where: (params: {
        firstEvaluatedKey?: number[] | null;
        lastEvaluatedKey?: number[] | null;
    }) => {
        const order = queryOrder(params);
        const { firstEvaluatedKey, lastEvaluatedKey } = params;
        if (order === "forward") {
            const lastBlockNumber = lastEvaluatedKey![0];
            const lastTransactionIndex = lastEvaluatedKey![1];
            const lastTransactionOutputIndex = lastEvaluatedKey![2];
            return Sequelize.literal(
                `("UTXO"."blockNumber", "UTXO"."transactionIndex", "UTXO"."transactionOutputIndex")<(${lastBlockNumber}, ${lastTransactionIndex}, ${lastTransactionOutputIndex})`
            );
        } else if (order === "reverse") {
            const lastBlockNumber = firstEvaluatedKey![0];
            const lastTransactionIndex = firstEvaluatedKey![1];
            const lastTransactionOutputIndex = firstEvaluatedKey![2];
            return Sequelize.literal(
                `("UTXO"."blockNumber", "UTXO"."transactionIndex", "UTXO"."transactionOutputIndex")>(${lastBlockNumber}, ${lastTransactionIndex}, ${lastTransactionOutputIndex})`
            );
        }
    }
};

type BlockEvaluationKey = [number];
export const blockPagination = {
    orderby: (params: {
        firstEvaluatedKey?: BlockEvaluationKey | null;
        lastEvaluatedKey?: BlockEvaluationKey | null;
    }) => {
        switch (queryOrder(params)) {
            case "forward":
                return [["number", "DESC"]];
            case "reverse":
                return [["number", "ASC"]];
            default:
                throw Error("Unreachable");
        }
    },
    where: (params: {
        firstEvaluatedKey?: BlockEvaluationKey | null;
        lastEvaluatedKey?: BlockEvaluationKey | null;
    }) => {
        switch (queryOrder(params)) {
            case "forward": {
                const [blockNumber] = params.lastEvaluatedKey!;
                return { number: { [Sequelize.Op.lt]: blockNumber } };
            }
            case "reverse": {
                const [blockNumber] = params.firstEvaluatedKey!;
                return { number: { [Sequelize.Op.gt]: blockNumber } };
            }
            default:
                throw Error("Unreachable");
        }
    }
};

export const aggsUTXOPagination = {
    byAssetType: {
        forwardOrder: [["assetType", "DESC"]],
        reverseOrder: [["assetType", "ASC"]],
        orderby: (params: {
            firstEvaluatedKey?: number[] | null;
            lastEvaluatedKey?: number[] | null;
        }) => {
            const order = queryOrder(params);
            if (order === "forward") {
                return aggsUTXOPagination.byAssetType.forwardOrder;
            } else if (order === "reverse") {
                return aggsUTXOPagination.byAssetType.reverseOrder;
            }
        },
        where: (params: {
            firstEvaluatedKey?: number[] | null;
            lastEvaluatedKey?: number[] | null;
        }) => {
            const order = queryOrder(params);
            const { firstEvaluatedKey, lastEvaluatedKey } = params;
            if (order === "forward") {
                const assetType = lastEvaluatedKey![0];
                return {
                    assetType: {
                        [Sequelize.Op.lt]: assetType
                    }
                };
            } else if (order === "reverse") {
                const assetType = firstEvaluatedKey![0];
                return {
                    assetType: {
                        [Sequelize.Op.gt]: assetType
                    }
                };
            }
        }
    },
    byAddress: {
        forwardOrder: [["address", "DESC"]],
        reverseOrder: [["address", "ASC"]],
        orderby: (params: {
            firstEvaluatedKey?: number[] | null;
            lastEvaluatedKey?: number[] | null;
        }) => {
            const order = queryOrder(params);
            if (order === "forward") {
                return aggsUTXOPagination.byAddress.forwardOrder;
            } else if (order === "reverse") {
                return aggsUTXOPagination.byAddress.reverseOrder;
            }
        },
        where: (params: {
            firstEvaluatedKey?: number[] | null;
            lastEvaluatedKey?: number[] | null;
        }) => {
            const order = queryOrder(params);
            const { firstEvaluatedKey, lastEvaluatedKey } = params;
            if (order === "forward") {
                const address = lastEvaluatedKey![0];
                return {
                    address: {
                        [Sequelize.Op.lt]: address
                    }
                };
            } else if (order === "reverse") {
                const address = firstEvaluatedKey![0];
                return {
                    address: {
                        [Sequelize.Op.gt]: address
                    }
                };
            }
        }
    }
};

export const txPagination = {
    forwardOrder: [["blockNumber", "DESC"], ["transactionIndex", "DESC"]],
    reverseOrder: [["blockNumber", "ASC"], ["transactionIndex", "ASC"]],
    orderby: (params: {
        firstEvaluatedKey?: number[] | null;
        lastEvaluatedKey?: number[] | null;
    }) => {
        const order = queryOrder(params);
        if (order === "forward") {
            return txPagination.forwardOrder;
        } else if (order === "reverse") {
            return txPagination.reverseOrder;
        }
    },
    where: (params: {
        firstEvaluatedKey?: number[] | null;
        lastEvaluatedKey?: number[] | null;
    }) => {
        const order = queryOrder(params);
        const { firstEvaluatedKey, lastEvaluatedKey } = params;
        if (order === "forward") {
            const blockNumber = lastEvaluatedKey![0];
            const transactionIndex = lastEvaluatedKey![1];
            return Sequelize.literal(
                `("blockNumber", "transactionIndex")<(${blockNumber}, ${transactionIndex})`
            );
        } else if (order === "reverse") {
            const blockNumber = firstEvaluatedKey![0];
            const transactionIndex = firstEvaluatedKey![1];
            return Sequelize.literal(
                `("blockNumber", "transactionIndex")>(${blockNumber}, ${transactionIndex})`
            );
        }
    }
};

export const addressLogPagination = {
    bySeq: {
        forwardOrder: [["seq", "ASC"]],
        reverseOrder: [["seq", "DESC"]],
        orderby: (params: {
            firstEvaluatedKey?: number[] | null;
            lastEvaluatedKey?: number[] | null;
        }) => {
            const order = queryOrder(params);
            if (order === "forward") {
                return addressLogPagination.bySeq.forwardOrder;
            } else if (order === "reverse") {
                return addressLogPagination.bySeq.reverseOrder;
            }
        },
        where: (params: {
            firstEvaluatedKey?: number[] | null;
            lastEvaluatedKey?: number[] | null;
        }) => {
            const order = queryOrder(params);
            const { firstEvaluatedKey, lastEvaluatedKey } = params;
            if (order === "forward") {
                const [seq] = lastEvaluatedKey!;
                return {
                    seq: {
                        [Sequelize.Op.gt]: seq
                    }
                };
            } else if (order === "reverse") {
                const [seq] = firstEvaluatedKey!;
                return {
                    seq: {
                        [Sequelize.Op.lt]: seq
                    }
                };
            }
        }
    }
};

export const pendingTxPagination = {
    forwardOrder: [["pendingTimestamp", "DESC"]],
    reverseOrder: [["pendingTimestamp", "ASC"]],
    orderby: (params: {
        firstEvaluatedKey?: number[] | null;
        lastEvaluatedKey?: number[] | null;
    }) => {
        const order = queryOrder(params);
        if (order === "forward") {
            return pendingTxPagination.forwardOrder;
        } else if (order === "reverse") {
            return pendingTxPagination.reverseOrder;
        }
    },
    where: (params: {
        firstEvaluatedKey?: number[] | null;
        lastEvaluatedKey?: number[] | null;
    }) => {
        const order = queryOrder(params);
        const { firstEvaluatedKey, lastEvaluatedKey } = params;
        if (order === "forward") {
            const [pendingTimestamp] = lastEvaluatedKey!;
            return {
                pendingTimestamp: {
                    [Sequelize.Op.lt]: pendingTimestamp
                }
            };
        } else if (order === "reverse") {
            const [pendingTimestamp] = firstEvaluatedKey!;
            return {
                pendingTimestamp: {
                    [Sequelize.Op.gt]: pendingTimestamp
                }
            };
        }
    }
};
