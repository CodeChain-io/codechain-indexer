import { H160 } from "codechain-primitives";
import * as Sequelize from "sequelize";
import models from "..";
import * as Exception from "../../exception";

export async function getByAddress(params: {
    address: string;
    assetType?: H160 | null;
    page?: number | null;
    itemsPerPage?: number | null;
}) {
    const { address, assetType, page = 1, itemsPerPage = 15 } = params;
    const query: any = getAggsUTXOQuery({
        address,
        assetType
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
            order: [["address", "DESC"], ["assetType", "DESC"]],
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!,
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
    page?: number | null;
    itemsPerPage?: number | null;
}) {
    const { address, assetType, page = 1, itemsPerPage = 15 } = params;
    const query: any = getAggsUTXOQuery({
        address,
        assetType
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
            order: [["assetType", "DESC"], ["address", "DESC"]],
            limit: itemsPerPage!,
            offset: (page! - 1) * itemsPerPage!,
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
}) {
    const { address, assetType } = params;
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

    return query;
}
