import {Buffer} from "buffer";
import {expect} from "chai";
import {trun} from "@isomp4/box-moof";

/* eslint-disable array-element-newline */

const goodData = Buffer.from([
    0x00, 0x00, 0x00, 0x14, // size: 20
    0x74, 0x72, 0x75, 0x6E, // type: trun
    0x00, 0x00, 0x00, 0x01, // version and flags: 0x0 and 0x1 (dataOffset present)
    0x00, 0x00, 0x00, 0x01, // sample count: 1
    0x00, 0x00, 0x00, 0x68, // dataOffset: 104
]);

/* eslint-enable array-element-newline */

function checkGoodData(data: Buffer) {
    const result = trun.decode(data);
    if (typeof result === "number") {
        expect.fail("failed with required bytes: " + result);
        return;
    }
    expect(result.size).eq(20);
    expect(result.size).eq(trun.decodedBytes); // no children
    expect(result.type).eq("trun");
    expect(result.samples.length).eq(1);
    expect(result.samples[0].duration).eq(undefined);
    expect(result.samples[0].size).eq(undefined);
    expect(result.samples[0].flags).eq(undefined);
    expect(result.samples[0].compositionTimeOffset).eq(undefined);
}

describe("trun", () => {
    // it("should fail to decode bad data (6 bytes)", () => {
    //     const result = trun.decode(badData6);
    //     expect(result).to.be.a("number");
    //     expect(result).to.be.gt(badData6.length);
    // });
    // it("should fail to decode bad data (8 bytes)", () => {
    //     const result = ftyp.decode(badData8);
    //     expect(result).to.be.a("number");
    //     expect(result).to.be.gt(badData8.length);
    // });
    // it("should fail to decode bad data (12 bytes)", () => {
    //     const result = ftyp.decode(badData12);
    //     expect(result).to.be.a("number");
    //     expect(result).to.be.gt(badData12.length);
    // });
    // it("should fail to decode bad data (22 bytes)", () => {
    //     const result = ftyp.decode(badData22);
    //     expect(result).to.be.a("number");
    //     expect(result).to.be.gt(badData22.length);
    // });
    it("should decode good data (20 bytes)", () => {
        checkGoodData(goodData);
    });
    // it("should not parse extra data (36 bytes)", () => {
    //     checkGoodData(moreData);
    // });
});
