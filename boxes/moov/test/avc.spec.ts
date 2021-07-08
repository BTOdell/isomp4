import {Buffer} from "buffer";
import {expect} from "chai";
import {avcC} from "@isomp4/box-moov";

/* eslint-disable array-element-newline */

const badData8: Buffer = Buffer.from([
    0x00, 0x00, 0x00, 0x32, // 50
    0x61, 0x76, 0x63, 0x43, // avcC
]);
const badData12: Buffer = Buffer.concat([badData8, Buffer.from([
    0x01, 0x4D, 0x00, 0x29,
])]);
const badData14: Buffer = Buffer.concat([badData8, Buffer.from([
    0x01, 0x4D, 0x00, 0x29, 0xFF, 0xE1,
])]);
const badData30: Buffer = Buffer.concat([badData14, Buffer.from([
    0x00, 0x1B, 0x67, 0x4D, 0x00, 0x29, 0xE2, 0x90, 0x0A, 0x00, 0xB7, 0x60, 0x2D, 0xC0, 0x40, 0x40,
])]);
const badData43: Buffer = Buffer.concat([badData14, Buffer.from([
    0x00, 0x1B, 0x67, 0x4D, 0x00, 0x29, 0xE2, 0x90, 0x0A, 0x00, 0xB7, 0x60, 0x2D, 0xC0, 0x40, 0x40, 0x69, 0x40, 0x03, 0x6E, 0xE8, 0x00, 0x66, 0xFF, 0x30, 0x03, 0xC4, 0x88, 0xA8,
])]);
const badData45: Buffer = Buffer.concat([badData43, Buffer.from([
    0x01, 0x00,
])]);
const goodData: Buffer = Buffer.concat([badData43, Buffer.from([
    0x01, 0x00, 0x04, 0x68, 0xEE, 0x3C, 0x80,
])]);
const moreData: Buffer = Buffer.concat([goodData, Buffer.from([
    0xCA, 0xFE, 0xBA, 0xBE, // extra that shouldn't be parsed
])]);

/* eslint-enable array-element-newline */

function checkGoodData(data: Buffer) {
    const result = avcC.decode(data);
    if (typeof result === "number") {
        expect.fail("failed with required bytes: " + result);
        return;
    }
    expect(result.size).eq(50);
    expect(result.size).eq(avcC.decodedBytes); // no children
    expect(result.type).eq("avcC");
    expect(result.configurationVersion).eq(1);
    expect(result.profileIndication).eq(0x4D);
    expect(result.profileCompatibility).eq(0x00);
    expect(result.levelIndication).eq(0x29);
    expect(result.lengthSizeMinusOne).eq(3);
    expect(result.sequenceParameterSets.length).eq(1);
    expect(result.sequenceParameterSets[0].length).eq(27);
    expect(result.pictureParameterSets.length).eq(1);
    expect(result.pictureParameterSets[0].length).eq(4);
}

describe("avcC", () => {
    it("should fail to decode bad data (8 bytes)", () => {
        const result = avcC.decode(badData8);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData8.length);
    });
    it("should fail to decode bad data (12 bytes)", () => {
        const result = avcC.decode(badData12);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData12.length);
    });
    it("should fail to decode bad data (14 bytes)", () => {
        const result = avcC.decode(badData14);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData14.length);
    });
    it("should fail to decode bad data (30 bytes)", () => {
        const result = avcC.decode(badData30);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData30.length);
    });
    it("should fail to decode bad data (43 bytes)", () => {
        const result = avcC.decode(badData43);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData43.length);
    });
    it("should fail to decode bad data (45 bytes)", () => {
        const result = avcC.decode(badData45);
        expect(result).to.be.a("number");
        expect(result).to.be.gt(badData45.length);
    });
    it("should decode good data (50 bytes)", () => {
        checkGoodData(goodData);
    });
    it("should not parse extra data (54 bytes)", () => {
        checkGoodData(moreData);
    });
});
