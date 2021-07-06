import {expect} from "chai";
import {readFileSync} from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import type {BoxHeader} from "@isomp4/core";
import {MP4Parser} from "@isomp4/parser";

const __dirname = dirname(fileURLToPath(import.meta.url));

function read(relativePath: string): Buffer {
    return readFileSync(join(__dirname, relativePath));
}

//const bunnyVideo = read("Big_Buck_Bunny_360_10s_2MB.mp4");
const fragmentedVideo = read("fragmented.mp4");

describe("parser", () => {
    it("should parse all at once", () => {
        const parser = new MP4Parser();

        parser.boxStarted = (header: BoxHeader) => {
            console.log("started:", header.type);
            return true;
        };
        parser.boxEnded = (header: BoxHeader) => {
            console.log("ended:", header.type);
        };

        parser.append(fragmentedVideo);

        expect(true).eq(true);
    });
    it("should parse one byte at a time", () => {
        // TODO
        expect(true).eq(true);
    });
});
