import {Buffer} from "buffer";
import {expect} from "chai";
import {ftyp} from "@isomp4/box-ftyp";

/* eslint-disable array-element-newline */

const badData6: Buffer = Buffer.from([
    0x00, 0x00, 0x00, 0x06, // size: 6 (dec)
    0x66, 0x74,             // type: ft
]);
const badData8: Buffer = Buffer.from([
    0x00, 0x00, 0x00, 0x20, // size: 32 (dec)
    0x66, 0x74, 0x79, 0x70, // type: ftyp,
]);
const badData12: Buffer = Buffer.concat([
    badData8,
    Buffer.from([
        0x6D, 0x70, 0x34, 0x32, // majorBrand: mp42
    ]),
]);
const badData22: Buffer = Buffer.from([
    0x00, 0x00, 0x00, 0x20, // size: 32 (dec)
    0x66, 0x74, 0x79, 0x70, // type: ftyp
    0x6D, 0x70, 0x34, 0x32, // majorBrand: mp42
    0x00, 0x00, 0x00, 0x00, // minorVersion: 0
    0x6D, 0x70, 0x34, 0x32, // compatible brand: mp42
    0x6D, 0x70, // compatible brand: mp
]);
const goodData: Buffer = Buffer.concat([
    badData12,
    Buffer.from([
        0x00, 0x00, 0x00, 0x00, // minorVersion: 0
        0x6D, 0x70, 0x34, 0x32, // compatible brand: mp42
        0x6D, 0x70, 0x34, 0x31, // compatible brand: mp41
        0x69, 0x73, 0x6F, 0x6D, // compatible brand: isom
        0x69, 0x73, 0x6F, 0x32, // compatible brand: iso2
    ]),
]);
const moreData: Buffer = Buffer.concat([goodData, Buffer.from([
    0xCA, 0xFE, 0xBA, 0xBE, // extra that shouldn't be parsed
])]);

/* eslint-enable array-element-newline */

function checkGoodData(data: Buffer) {
    const result = ftyp.decode(data);
    if (typeof result === "number") {
        expect.fail("failed with required bytes: " + result);
        return;
    }
    expect(result.size).eq(32);
    expect(result.size).eq(ftyp.decodedBytes); // no children
    expect(result.type).eq("ftyp");
    expect(result.majorBrand).eq("mp42");
    expect(result.minorVersion).eq(0);
    expect(result.compatibleBrands.length).eq(4);
    expect(result.compatibleBrands[2]).eq("isom");
}

describe("ftyp", () => {
    it("should fail to decode bad data (6 bytes)", () => {
        const result = ftyp.decode(badData6);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData6.length);
    });
    it("should fail to decode bad data (8 bytes)", () => {
        const result = ftyp.decode(badData8);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData8.length);
    });
    it("should fail to decode bad data (12 bytes)", () => {
        const result = ftyp.decode(badData12);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData12.length);
    });
    it("should fail to decode bad data (22 bytes)", () => {
        const result = ftyp.decode(badData22);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData22.length);
    });
    it("should decode good data (32 bytes)", () => {
        checkGoodData(goodData);
    });
    it("should not parse extra data (36 bytes)", () => {
        checkGoodData(moreData);
    });
});
