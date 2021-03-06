import type {Buffer} from "buffer";
import type {BoxHeader, FullBox} from "@isomp4/core";
import {
    FullBoxEncoding,
    readDate,
    readDate64,
    readFixed16x16,
    readFixed8x8,
    readMatrix,
    readSafeUInt64BE,
} from "@isomp4/core";

export interface MovieHeaderBox extends FullBox {
    creationTime: Date;
    modificationTime: Date;
    timescale: number;
    duration: number;
    rate: number;
    volume: number;
    matrix: number[];
    nextTrackID: number;
}

class MovieHeaderBoxEncoding extends FullBoxEncoding {

    constructor() {
        super("mvhd");
    }

    public override encodingLength(obj: MovieHeaderBox): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: MovieHeaderBox, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        // let offset = this.encodedBytes;
        // // TODO implementing encoding
        // this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): MovieHeaderBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let creationTime: Date;
        let modificationTime: Date;
        let timescale: number;
        let duration: number;
        let offset: number = this.decodedBytes;
        if (superBox.version === 1) {
            // 64-bit times
            if (buffer.length < offset + 28) {
                return offset + 28;
            }
            creationTime = readDate64(buffer, offset);
            offset += 8;
            modificationTime = readDate64(buffer, offset);
            offset += 8;
            timescale = buffer.readUInt32BE(offset);
            offset += 4;
            duration = readSafeUInt64BE(buffer, offset);
            offset += 8;
        } else { // version = 0
            // 32-bit times
            if (buffer.length < offset + 16) {
                return offset + 16;
            }
            creationTime = readDate(buffer, offset);
            offset += 4;
            modificationTime = readDate(buffer, offset);
            offset += 4;
            timescale = buffer.readUInt32BE(offset);
            offset += 4;
            duration = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length < offset + 80) {
            return offset + 80;
        }
        const rate: number = readFixed16x16(buffer, offset);
        offset += 4;
        const volume: number = readFixed8x8(buffer, offset);
        offset += 2;
        offset += 10; // skip reserved (2 + 4*2)
        const matrix: number[] = readMatrix(buffer, offset, 9);
        offset += 36; // 4 * 9
        offset += 24; // skip predefined (4*6)
        const nextTrackID: number = buffer.readUInt32BE(offset);
        offset += 4;
        this.decodedBytes = offset;
        return {
            ...superBox,
            creationTime,
            modificationTime,
            timescale,
            duration,
            rate,
            volume,
            matrix,
            nextTrackID,
        };
    }

}

export const mvhd = new MovieHeaderBoxEncoding();
