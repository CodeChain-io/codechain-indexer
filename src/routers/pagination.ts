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
            rows.unshift();
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
