import type {Buffer} from "buffer";
import type {Box, BoxHeader} from "@isomp4/core";
import {BoxEncoding, readFixed16x16} from "@isomp4/core";

export interface SampleEntry extends Box {
    dataReferenceIndex: number;
}

export abstract class SampleEntryEncoding extends BoxEncoding {

    public override encodingLength(obj: SampleEntry): number {
        return super.encodingLength(obj) + 8;
    }

    public override encodeTo(obj: SampleEntry, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        //let offset: number = this.encodedBytes;
        // TODO implement encoding
        //this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): SampleEntry | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let offset: number = this.decodedBytes;
        if (buffer.length < offset + 8) {
            return offset + 8;
        }
        offset += 6; // skip for reserved
        const dataReferenceIndex: number = buffer.readUInt16BE(offset);
        offset += 2;
        this.decodedBytes = offset;
        return {
            ...superBox,
            dataReferenceIndex,
        };
    }

}

export interface VisualSampleEntry extends SampleEntry {
    width: number;
    height: number;
    horizontalResolution: number;
    verticalResolution: number;
    frameCount: number;
    compressorName: string;
    depth: number;
}

export abstract class VisualSampleEntryEncoding extends SampleEntryEncoding {

    public override encodingLength(obj: VisualSampleEntry): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: VisualSampleEntry, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        //let offset: number = this.encodedBytes;
        // TODO implement encoding
        //this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): VisualSampleEntry | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let offset: number = this.decodedBytes;
        if (buffer.length < offset + 70) {
            return offset + 70;
        }
        offset += 16; // skip pre-defined and reserved
        const width: number = buffer.readUInt16BE(offset);
        offset += 2;
        const height: number = buffer.readUInt16BE(offset);
        offset += 2;
        const horizontalResolution: number = readFixed16x16(buffer, offset);
        offset += 4;
        const verticalResolution: number = readFixed16x16(buffer, offset);
        offset += 4;
        offset += 4; // skip reserved
        const frameCount: number = buffer.readUInt16BE(offset);
        offset += 2;
        const compressorNameLength: number = buffer.readUInt8(offset++);
        const compressorName: string = buffer.toString("binary", offset, offset + Math.min(compressorNameLength, 31));
        offset += 31;
        const depth: number = buffer.readUInt16BE(offset);
        offset += 2;
        offset += 2; // skip pre-defined
        this.decodedBytes = offset;
        return {
            ...superBox,
            width,
            height,
            horizontalResolution,
            verticalResolution,
            frameCount,
            compressorName,
            depth,
        };
    }

}
