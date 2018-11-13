import { Block } from "codechain-sdk/lib/core/Block";
import { TypeConverter } from "../src/es/utils/TypeConverter";
const blockJson = {
    author: "tccqyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhhn9p3",
    extraData: [
        23,
        108,
        91,
        111,
        253,
        100,
        40,
        143,
        87,
        206,
        189,
        160,
        126,
        135,
        186,
        91,
        4,
        70,
        5,
        195,
        246,
        153,
        51,
        67,
        233,
        113,
        143,
        161,
        0,
        209,
        115,
        124
    ],
    hash: "0x348c4a1ba4a81a63d980eb709abda9008c8fdb3821d2d110a67131bb92eff85d",
    invoicesRoot: "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0",
    number: 0,
    parcels: [],
    parcelsRoot: "0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0",
    parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    score: "0x20000",
    seal: [],
    stateRoot: "0x09f943122bfbb85adda8209ba72514374f71826fd874e08855b64bc95498cb02",
    timestamp: 0
};
describe("type-converter", () => {
    let typeConverter: TypeConverter;
    beforeAll(async () => {
        typeConverter = new TypeConverter("http://127.0.0.1:8080", "http://127.0.0.1:5601");
    });

    test("from block", async () => {
        const blockDoc = await typeConverter.fromBlock(Block.fromJSON(blockJson), 50);
        expect(blockDoc.number).toBe(0);
    });
});
