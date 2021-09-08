import type {Buffer} from "buffer";
import {expect} from "chai";
import {readFileSync} from "fs";
import {join} from "path";
import {stsd} from "@isomp4/box-moov";
import type {BoxHeader} from "@isomp4/core";
import {MP4Parser} from "@isomp4/parser";

function read(relativePath: string): Buffer {
    return readFileSync(join(__dirname, relativePath));
}

const malformedAvcC = read("malformed_avcC.mp4");

describe("parser-moov", () => {
    it("should parse avcC with missing ext fields", () => {
        let success: boolean = false;
        const parser = new MP4Parser();
        parser.registerBox(stsd, true);
        parser.boxEnded = (header: BoxHeader) => {
            if (header.type === "avc1") {
                success = true;
            }
        };
        parser.append(malformedAvcC);
        expect(success).eq(true);
    });
});
