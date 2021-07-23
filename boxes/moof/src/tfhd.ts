import type {Buffer} from "buffer";
import type {BoxHeader, FullBox} from "@isomp4/core";
import {FullBoxEncoding, readSafeUInt64BE} from "@isomp4/core";

export interface TrackFragmentHeaderBox extends FullBox {
    trackID: number;
    // Optional based on flags
    baseDataOffset?: number;
    sampleDescriptionIndex?: number;
    defaultSampleDuration?: number;
    defaultSampleSize?: number;
    defaultSampleFlags?: number;
}

export namespace TrackFragmentHeaderBox {

    export interface Flags {
        baseDataOffsetPresent: boolean;
        sampleDescriptionIndexPresent: boolean;
        defaultSampleDurationPresent: boolean;
        defaultSampleSizePresent: boolean;
        defaultSampleFlagsPresent: boolean;
        durationIsEmpty: boolean;
        defaultBaseIsMoof: boolean;
    }

    export function parseFlags(flags: number): Flags {
        return {
            baseDataOffsetPresent: (flags & 0x000001) !== 0,
            sampleDescriptionIndexPresent: (flags & 0x000002) !== 0,
            defaultSampleDurationPresent: (flags & 0x000008) !== 0,
            defaultSampleSizePresent: (flags & 0x000010) !== 0,
            defaultSampleFlagsPresent: (flags & 0x000020) !== 0,
            durationIsEmpty: (flags & 0x010000) !== 0,
            defaultBaseIsMoof: (flags & 0x020000) !== 0,
        };
    }

}

class TrackFragmentHeaderBoxEncoding extends FullBoxEncoding {

    constructor() {
        super("tfhd");
    }

    public override encodingLength(obj: TrackFragmentHeaderBox): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: TrackFragmentHeaderBox, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        // let offset = this.encodedBytes;
        // // TODO implementing encoding
        // this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): TrackFragmentHeaderBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let offset: number = this.decodedBytes;
        if (buffer.length < offset + 4) {
            return offset + 4;
        }
        const trackID: number = buffer.readUInt32BE(offset);
        offset += 4;
        const flags: TrackFragmentHeaderBox.Flags = TrackFragmentHeaderBox.parseFlags(superBox.flags);
        let baseDataOffset: number | undefined;
        if (flags.baseDataOffsetPresent) {
            if (buffer.length < offset + 8) {
                return offset + 8;
            }
            baseDataOffset = readSafeUInt64BE(buffer, offset);
            offset += 8;
        }
        let sampleDescriptionIndex: number | undefined;
        if (flags.sampleDescriptionIndexPresent) {
            if (buffer.length < offset + 4) {
                return offset + 4;
            }
            sampleDescriptionIndex = buffer.readUInt32BE(offset);
            offset += 4;
        }
        let defaultSampleDuration: number | undefined;
        if (flags.defaultSampleDurationPresent) {
            if (buffer.length < offset + 4) {
                return offset + 4;
            }
            defaultSampleDuration = buffer.readUInt32BE(offset);
            offset += 4;
        }
        let defaultSampleSize: number | undefined;
        if (flags.defaultSampleSizePresent) {
            if (buffer.length < offset + 4) {
                return offset + 4;
            }
            defaultSampleSize = buffer.readUInt32BE(offset);
            offset += 4;
        }
        let defaultSampleFlags: number | undefined;
        if (flags.defaultSampleFlagsPresent) {
            if (buffer.length < offset + 4) {
                return offset + 4;
            }
            defaultSampleFlags = buffer.readUInt32BE(offset);
            offset += 4;
        }
        this.decodedBytes = offset;
        return {
            ...superBox,
            trackID,
            baseDataOffset,
            sampleDescriptionIndex,
            defaultSampleDuration,
            defaultSampleSize,
            defaultSampleFlags,
        };
    }

}

export const tfhd = new TrackFragmentHeaderBoxEncoding();
