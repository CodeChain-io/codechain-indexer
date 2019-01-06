import { H256 } from "codechain-sdk/lib/core/classes";
import models from "../src/models";
import * as ParcelModel from "../src/models/logic/parcel";
import * as Helper from "./helper";

beforeAll(async done => {
    await Helper.runExample("import-test-account");
    done();
});

afterAll(async done => {
    await Helper.sdk.rpc.devel.startSealing();
    await models.sequelize.close();
    done();
});

test(
    "Check pending parcel",
    async done => {
        await Helper.sdk.rpc.devel.stopSealing();
        Helper.runExample("send-signed-parcel");
        await waitForSecond(2);
        await Helper.worker.sync();

        const pendingParcelsInst = await ParcelModel.getPendingParcels({});
        expect(pendingParcelsInst.length).toEqual(1);

        const pendingParcel = await pendingParcelsInst![0]!.get();
        expect(pendingParcel.isPending).toEqual(true);

        await Helper.sdk.rpc.devel.startSealing();
        await Helper.worker.sync();

        const newPendingParcelsInst = await ParcelModel.getPendingParcels({});
        expect(newPendingParcelsInst.length).toEqual(0);

        const indexedParcelInst = await ParcelModel.getByHash(
            new H256(pendingParcel.hash)
        );
        expect(indexedParcelInst).toBeTruthy();
        const indexedParcel = indexedParcelInst!.get();
        expect(indexedParcel.isPending).toEqual(false);

        done();
    },
    25000
);

function waitForSecond(second: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, second * 1000);
    });
}
