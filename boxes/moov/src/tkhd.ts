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

export interface TrackHeaderBox extends FullBox {
    creationTime: Date;
    modificationTime: Date;
    trackID: number;
    duration: number;
    layer: number;
    alternateGroup: number;
    volume: number;
    matrix: number[];
    width: number;
    height: number;
}

export namespace TrackHeaderBox {

    export interface Flags {
        enabled: boolean;
        inMovie: boolean;
        inPreview: boolean;
        sizeIsAspectRatio: boolean;
    }

    export function parseFlags(flags: number): Flags {
        return {
            enabled: (flags & 0x000001) !== 0,
            inMovie: (flags & 0x000002) !== 0,
            inPreview: (flags & 0x000004) !== 0,
            sizeIsAspectRatio: (flags & 0x000008) !== 0,
        };
    }

}

class TrackHeaderBoxEncoding extends FullBoxEncoding {

    constructor() {
        super("tkhd");
    }

    public override encodingLength(obj: TrackHeaderBox): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: TrackHeaderBox, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        // let offset = this.encodedBytes;
        // // TODO implementing encoding
        // this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): TrackHeaderBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let creationTime: Date;
        let modificationTime: Date;
        let trackID: number;
        let duration: number;
        let offset: number = this.decodedBytes;
        if (superBox.version === 1) {
            // 64-bit times and duration
            if (buffer.length < offset + 32) {
                return offset + 32;
            }
            creationTime = readDate64(buffer, offset);
            offset += 8;
            modificationTime = readDate64(buffer, offset);
            offset += 8;
            trackID = buffer.readUInt32BE(16);
            offset += 4;
            offset += 4; // reserved = 0
            duration = readSafeUInt64BE(buffer, offset);
            offset += 8;
        } else { // version = 0
            // 32-bit times and duration
            if (buffer.length < offset + 20) {
                return offset + 20;
            }
            creationTime = readDate(buffer, offset);
            offset += 4;
            modificationTime = readDate(buffer, offset);
            offset += 4;
            trackID = buffer.readUInt32BE(offset);
            offset += 4;
            offset += 4; // reserved = 0
            duration = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length < offset + 80) {
            return offset + 80;
        }
        offset += 8; // reserved = 0
        const layer: number = buffer.readInt16BE(offset);
        offset += 2;
        const alternateGroup: number = buffer.readInt16BE(offset);
        offset += 2;
        const volume: number = readFixed8x8(buffer, offset);
        offset += 2;
        offset += 2; // reserved = 0
        const matrix: number[] = readMatrix(buffer, offset, 9);
        offset += 36; // 4 * 9
        const width: number = readFixed16x16(buffer, offset);
        offset += 4;
        const height: number = readFixed16x16(buffer, offset);
        offset += 4;
        this.decodedBytes = offset;
        return {
            ...superBox,
            creationTime,
            modificationTime,
            trackID,
            duration,
            layer,
            alternateGroup,
            volume,
            matrix,
            width,
            height,
        };
    }

}

export const tkhd = new TrackHeaderBoxEncoding();
