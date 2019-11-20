import * as Sequelize from "sequelize";

export function createPaginationResult(params: {
    query: {
        firstEvaluatedKey?: any[] | null;
        lastEvaluatedKey?: any[] | null;
    };
    result: {
        data: any[];
        firstEvaluatedKey: string | null;
        lastEvaluatedKey: string | null;
    };
    itemsPerPage: number;
}) {
    const { query, result, itemsPerPage } = params;

    const firstQuery = !query.firstEvaluatedKey && !query.lastEvaluatedKey;
    const order: "forward" | "reverse" = queryOrder(query);

    if (order === "reverse") {
        result.data = result.data.reverse();
    }

    const hasMorePage = result.data.length > itemsPerPage;
    if (hasMorePage) {
        if (order === "forward") {
            result.data.pop();
        } else if (order === "reverse") {
            result.data.unshift();
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
    return {
        data: result.data,
        hasNextPage,
        hasPreviousPage,
        firstEvaluatedKey: result.firstEvaluatedKey,
        lastEvaluatedKey: result.lastEvaluatedKey
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
