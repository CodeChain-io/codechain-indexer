import { H160 } from "codechain-sdk/lib/core/classes";
import * as request from "request";
import { Transaction } from "sequelize";
import * as sharp from "sharp";
import models from "..";
import * as Exception from "../../exception";
import { strip0xPrefix } from "./utils/format";

export async function createAssetImage(
    transactionHash: string,
    assetType: string,
    assetURL: string,
    options: { transaction?: Transaction } = {}
): Promise<void> {
    let imageDataBuffer;
    try {
        const imageBuffer = await getImageBuffer(assetURL);
        if (imageBuffer) {
            imageDataBuffer = await sharp(imageBuffer)
                .resize(100, 100)
                .png()
                .toBuffer();
        }
    } catch (e) {
        // assetURL can be an invalid form or unable to download.
    }
    if (imageDataBuffer) {
        try {
            await models.AssetImage.upsert(
                {
                    transactionHash: strip0xPrefix(transactionHash),
                    assetType: strip0xPrefix(assetType),
                    image: imageDataBuffer
                },
                { transaction: options.transaction }
            );
        } catch (err) {
            console.error(err);
            throw Exception.DBError();
        }
    }
}

export async function createAssetImageOfWCCC(
    transactionHash: string,
    options: { transaction?: Transaction } = {}
): Promise<void> {
    try {
        const image = await sharp("./resources/wCCC.png")
            .resize(100, 100)
            .png()
            .toBuffer();
        await models.AssetImage.create(
            {
                transactionHash,
                assetType: H160.zero().value,
                image
            },
            { transaction: options.transaction }
        );
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

export async function getByAssetType(assetType: H160) {
    try {
        return await models.AssetImage.findOne({
            where: {
                assetType: strip0xPrefix(assetType.value)
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError();
    }
}

function getImageBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        request({ url, encoding: null }, (err, _R, buffer) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(buffer);
        });
    });
}
