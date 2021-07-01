import type {Buffer} from "buffer";
import type {BoxEncoding, BoxHeader, FourCC, FullBox} from "@isomp4/core";
import {
    AbstractBoxEncoding,
    FullBoxHeader,
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

export const mvhd: BoxEncoding<MovieHeaderBox> = new class extends AbstractBoxEncoding<MovieHeaderBox> {

    public override readonly type: FourCC = "mvhd";

    public override encodingLength(obj: MovieHeaderBox): number {
        return 0;
    }

    public override encodeTo(obj: MovieHeaderBox, buf: Buffer): number {
        // TODO
        throw "implement";
    }

    public override decodeWithHeader(buffer: Buffer, header: BoxHeader): MovieHeaderBox | number {
        const fullBoxHeader = FullBoxHeader.parse(buffer);
        if (typeof fullBoxHeader === "number") {
            return fullBoxHeader;
        }
        let length: number = FullBoxHeader.decodedBytes;
        let creationTime: Date;
        let modificationTime: Date;
        let timescale: number;
        let duration: number;
        let offset: number;
        if (fullBoxHeader.version === 1) {
            // 64-bit times
            if (buffer.length < (length += 28)) {
                return length;
            }
            creationTime = readDate64(buffer, 0);
            modificationTime = readDate64(buffer, 8);
            timescale = buffer.readUInt32BE(16);
            duration = readSafeUInt64BE(buffer, 20);
            offset = 28;
        } else { // version = 0
            // 32-bit times
            if (buffer.length < (length += 16)) {
                return length;
            }
            creationTime = readDate(buffer, 0);
            modificationTime = readDate(buffer, 4);
            timescale = buffer.readUInt32BE(8);
            duration = buffer.readUInt32BE(12);
            offset = 16;
        }
        if (buffer.length < (length += 80)) {
            return length;
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
        //offset += 4;
        this.decodedBytes = length;
        return {
            ...header,
            ...fullBoxHeader,
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

}();
