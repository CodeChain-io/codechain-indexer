import { H160 } from "codechain-primitives";
import * as Sequelize from "sequelize";
import models from "..";
import * as Exception from "../../exception";
import { aggsUTXOPagination } from "../../routers/pagination";

export async function getByAddress(params: {
    address: string;
    assetType?: H160 | null;
    itemsPerPage?: number | null;
    firstEvaluatedKey?: [number] | null;
    lastEvaluatedKey?: [number] | null;
}) {
    const {
        address,
        assetType,
        itemsPerPage = 15,
        firstEvaluatedKey,
        lastEvaluatedKey
    } = params;
    const query: any = getAggsUTXOQuery({
        address,
        assetType,
        order: "assetType",
        firstEvaluatedKey,
        lastEvaluatedKey
    });

    const includeArray: any = [
        {
            as: "assetScheme",
            model: models.AssetScheme
        }
    ];

    try {
        return await models.AggsUTXO.findAll({
            where: {
                [Sequelize.Op.and]: query
            },
            order: aggsUTXOPagination.byAssetType.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            limit: itemsPerPage!,
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByAssetType(params: {
    assetType: H160;
    address?: string | null;
    itemsPerPage?: number | null;
    firstEvaluatedKey?: [number] | null;
    lastEvaluatedKey?: [number] | null;
}) {
    const {
        address,
        assetType,
        itemsPerPage = 15,
        firstEvaluatedKey,
        lastEvaluatedKey
    } = params;
    const query: any = getAggsUTXOQuery({
        address,
        assetType,
        order: "address",
        firstEvaluatedKey,
        lastEvaluatedKey
    });

    const includeArray: any = [
        {
            as: "assetScheme",
            model: models.AssetScheme
        }
    ];

    try {
        return await models.AggsUTXO.findAll({
            where: {
                [Sequelize.Op.and]: query
            },
            order: aggsUTXOPagination.byAddress.orderby({
                firstEvaluatedKey,
                lastEvaluatedKey
            }),
            limit: itemsPerPage!,
            include: includeArray
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

function getAggsUTXOQuery(params: {
    address?: string | null;
    assetType?: H160 | null;
    order: "assetType" | "address";
    firstEvaluatedKey?: [number] | null;
    lastEvaluatedKey?: [number] | null;
}) {
    const {
        order,
        address,
        assetType,
        firstEvaluatedKey,
        lastEvaluatedKey
    } = params;
    const query = [];
    if (address) {
        query.push({
            address
        });
    }
    if (assetType) {
        query.push({
            assetType: assetType.value
        });
    }

    if (firstEvaluatedKey || lastEvaluatedKey) {
        if (order === "assetType") {
            query.push(
                aggsUTXOPagination.byAssetType.where({
                    firstEvaluatedKey,
                    lastEvaluatedKey
                })
            );
        } else if (order === "address") {
            query.push(
                aggsUTXOPagination.byAddress.where({
                    firstEvaluatedKey,
                    lastEvaluatedKey
                })
            );
        }
    }

    return query;
}
