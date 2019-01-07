import { H256 } from "codechain-sdk/lib/core/classes";
import * as request from "request";
import * as sharp from "sharp";
import models from "..";
import * as Exception from "../../exception";

export async function createAssetImage(
    assetType: H256,
    assetURL: string
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
        console.log(e);
    }
    if (imageDataBuffer) {
        try {
            await models.AssetImage.upsert({
                assetType: assetType.value,
                image: imageDataBuffer.toString("base64")
            });
        } catch (err) {
            console.error(err);
            throw Exception.DBError;
        }
    }
}

export async function getByAssetType(assetType: H256) {
    try {
        return await models.AssetImage.findOne({
            where: {
                assetType: assetType.value
            }
        });
    } catch (err) {
        console.error(err);
        throw Exception.DBError;
    }
}

function getImageBuffer(url: string) {
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