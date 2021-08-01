import {Buffer} from "buffer";
import {expect} from "chai";
import {moof, traf} from "@isomp4/box-moof";
import type {Box, BoxHeader} from "@isomp4/core";
import {MP4Parser} from "@isomp4/parser";

/* eslint-disable array-element-newline */

const emptyMoof = Buffer.from([
    0x00, 0x00, 0x00, 0x08, // size: 8
    0x6D, 0x6F, 0x6F, 0x66, // type: moof
]);

const moofData = Buffer.from([
    0x00, 0x00, 0x00, 0x60, 0x6D, 0x6F, 0x6F, 0x66, 0x00, 0x00, 0x00, 0x10,
    0x6D, 0x66, 0x68, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x4D, 0x05,
    0x00, 0x00, 0x00, 0x48, 0x74, 0x72, 0x61, 0x66, 0x00, 0x00, 0x00, 0x1C,
    0x74, 0x66, 0x68, 0x64, 0x00, 0x00, 0x00, 0x38, 0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x03, 0xE4, 0x00, 0x01, 0x00, 0xC0,
    0x00, 0x00, 0x00, 0x10, 0x74, 0x66, 0x64, 0x74, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x1E, 0x15, 0x90, 0x00, 0x00, 0x00, 0x14, 0x74, 0x72, 0x75, 0x6E,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x68,
]);

/* eslint-enable array-element-newline */

describe("parser-moof", () => {
    it("should fully parse empty moof box", () => {
        let moofEnded: boolean = false;

        const parser = new MP4Parser();
        parser.registerBox(moof, true);
        parser.boxEnded = (header: BoxHeader) => {
            if (header.type === "moof") {
                moofEnded = true;
            }
        };
        parser.append(emptyMoof);

        expect(moofEnded).eq(true);
    });
    it("should fully decode with children", () => {
        let moofEnded: boolean = false;

        const parser = new MP4Parser();
        parser.registerBox(traf, true);
        parser.boxEnded = (header: BoxHeader) => {
            if (header.type === "moof") {
                moofEnded = true;
            }
        };
        parser.append(moofData);

        expect(moofEnded).eq(true);
    });
    it("should fully decode except trun box", () => {
        let moofEnded: boolean = false;

        const parser = new MP4Parser();
        parser.registerBox(traf, true);
        parser.boxStarted = (header: BoxHeader) => {
            return header.type !== "trun";
        };
        parser.boxEnded = (header: BoxHeader) => {
            if (header.type === "moof") {
                moofEnded = true;
            }
        };
        parser.append(moofData);

        expect(moofEnded).eq(true);
    });
    it("should finish without decoding tfdt box", () => {
        let moofEnded: boolean = false;

        const parser = new MP4Parser();
        parser.registerBox(traf, true);
        parser.boxDecoded = (box: Box) => {
            return box.type !== "tfdt";
        };
        parser.boxEnded = (header: BoxHeader) => {
            if (header.type === "moof") {
                moofEnded = true;
            }
        };
        parser.append(moofData);

        expect(moofEnded).eq(true);
    });
});
