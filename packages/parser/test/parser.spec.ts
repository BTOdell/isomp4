import {Buffer} from "buffer";
import {expect} from "chai";
import {readFileSync} from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import {moov} from "@isomp4/box-moov";
import type {Box, BoxHeader} from "@isomp4/core";
import {MP4Parser} from "@isomp4/parser";
import {BoxContainer} from "@isomp4/core";

const __dirname = dirname(fileURLToPath(import.meta.url));

function read(relativePath: string): Buffer {
    return readFileSync(join(__dirname, relativePath));
}

//const bunnyVideo = read("Big_Buck_Bunny_360_10s_2MB.mp4");
const fragmentedVideo = read("fragmented.mp4");

function allAtOnce(parser: MP4Parser, data: Buffer): void {
    parser.append(data);
}

function oneByteAtATime(parser: MP4Parser, data: Buffer): void {
    for (let i = 0; i < data.length; i++) {
        parser.append(data.slice(i, i + 1));
    }
}

function passthroughVideo(videoData: Buffer, append: (parser: MP4Parser, data: Buffer) => void): void {
    const parser = new MP4Parser();
    parser.registerBox(moov);

    const accum = Buffer.alloc(videoData.length);
    let offset: number = 0;

    parser.boxStarted = (header: BoxHeader, headerData: Buffer) => {
        offset += headerData.copy(accum, offset);
        return true;
    };
    parser.boxDecoded = (box: Box, boxData: Buffer) => {
        offset += boxData.copy(accum, offset);
        return true;
    };
    parser.boxData = (header: BoxHeader, boxData: Buffer) => {
        offset += boxData.copy(accum, offset);
    };

    append(parser, videoData);

    const output = Buffer.from(accum.buffer, 0, offset);
    expect(videoData.equals(output)).eq(true);
}

function parseFragmentedVideo(append: (parser: MP4Parser, data: Buffer) => void): void {
    const parser = new MP4Parser();
    parser.registerBox(moov);

    const topBoxes: {
        [type: string]: BoxHeader[],
    } = {};
    const decoded: {
        box?: Box,
    } = {};

    parser.boxStarted = (header: BoxHeader) => {
        if (header.type in topBoxes) {
            topBoxes[header.type].push(header);
        } else {
            topBoxes[header.type] = [header];
        }
        return true;
    };
    parser.boxDecoded = (box: Box) => {
        decoded.box = box;
        return true;
    };

    append(parser, fragmentedVideo);

    expect(topBoxes).to.have.all.keys("ftyp", "moov", "mvhd", "trak", "udta", "mvex", "moof", "mdat");
    if (decoded.box == null) {
        expect.fail("no box was decoded!");
        return;
    }
    if (!BoxContainer.isInstance(decoded.box)) {
        expect.fail("decoded moov box is not a container");
        return;
    }
    expect(decoded.box.type).eq("moov");
}

describe("parser", () => {
    it("should passthrough data without loss (all at once)", () => {
        passthroughVideo(fragmentedVideo, allAtOnce);
    });
    it("should passthrough data without loss (one byte at a time)", () => {
        passthroughVideo(fragmentedVideo, oneByteAtATime);
    });
    it("should parse boxes (all at once)", () => {
        parseFragmentedVideo(allAtOnce);
    });
    it("should parse boxes (one byte at a time)", () => {
        parseFragmentedVideo(oneByteAtATime);
    });
});
