import type {Buffer} from "buffer";
import type {BoxHeader, FullBox} from "@isomp4/core";
import {FullBoxEncoding} from "@isomp4/core";

interface TrackRunSample {
    duration?: number;
    size?: number;
    flags?: number;
    compositionTimeOffset?: number;
}

export interface TrackRunBox extends FullBox {
    // Note: sampleCount is encoded in the samples array
    // Optional based on flags
    dataOffset?: number;
    firstSampleFlags?: number;
    samples: TrackRunSample[];
}

export namespace TrackRunBox {

    export interface Flags {
        dataOffsetPresent: boolean;
        firstSampleFlagsPresent: boolean;
        sampleDurationPresent: boolean;
        sampleSizePresent: boolean;
        sampleFlagsPresent: boolean;
        sampleCompositionTimeOffsetsPresent: boolean;
    }

    export function parseFlags(flags: number): Flags {
        return {
            dataOffsetPresent: (flags & 0x000001) !== 0,
            firstSampleFlagsPresent: (flags & 0x000004) !== 0,
            sampleDurationPresent: (flags & 0x000100) !== 0,
            sampleSizePresent: (flags & 0x000200) !== 0,
            sampleFlagsPresent: (flags & 0x000400) !== 0,
            sampleCompositionTimeOffsetsPresent: (flags & 0x000800) !== 0,
        };
    }

}

class TrackRunBoxEncoding extends FullBoxEncoding {

    constructor() {
        super("trun");
    }

    public override encodingLength(obj: TrackRunBox): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: TrackRunBox, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        // let offset = this.encodedBytes;
        // // TODO implementing encoding
        // this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): TrackRunBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let offset: number = this.decodedBytes;
        if (buffer.length < offset + 4) {
            return offset + 4;
        }
        const sampleCount: number = buffer.readUInt32BE(offset);
        offset += 4;
        const bflags: TrackRunBox.Flags = TrackRunBox.parseFlags(superBox.flags);
        let dataOffset: number | undefined;
        if (bflags.dataOffsetPresent) {
            if (buffer.length < offset + 4) {
                return offset + 4;
            }
            dataOffset = buffer.readInt32BE(offset); // signed
            offset += 4;
        }
        let firstSampleFlags: number | undefined;
        if (bflags.firstSampleFlagsPresent) {
            if (bflags.sampleFlagsPresent) {
                throw new Error("Malformed input: Sample flags shall not be present!");
            }
            if (buffer.length < offset + 4) {
                return offset + 4;
            }
            firstSampleFlags = buffer.readUInt32BE(offset);
            offset += 4;
        }
        const bytesPerSample: number =
            (bflags.sampleDurationPresent ? 4 : 0) +
            (bflags.sampleSizePresent ? 4 : 0) +
            (bflags.sampleFlagsPresent ? 4 : 0) +
            (bflags.sampleCompositionTimeOffsetsPresent ? 4 : 0);
        const bytesForSamples: number = bytesPerSample * sampleCount;
        if (buffer.length < offset + bytesForSamples) {
            return offset + bytesForSamples;
        }
        const samples: TrackRunSample[] = [];
        for (let i = 0; i < sampleCount; i++) {
            let duration: number | undefined;
            let size: number | undefined;
            let flags: number | undefined;
            let compositionTimeOffset: number | undefined;
            if (bflags.sampleDurationPresent) {
                duration = buffer.readUInt32BE(offset);
                offset += 4;
            }
            if (bflags.sampleSizePresent) {
                size = buffer.readUInt32BE(offset);
                offset += 4;
            }
            if (bflags.sampleFlagsPresent) {
                flags = buffer.readUInt32BE(offset);
                offset += 4;
            } else if (bflags.firstSampleFlagsPresent && i === 0) {
                flags = firstSampleFlags;
            }
            if (bflags.sampleCompositionTimeOffsetsPresent) {
                switch (superBox.version) {
                    case 0:
                        compositionTimeOffset = buffer.readUInt32BE(offset); // Unsigned
                        break;
                    case 1:
                        compositionTimeOffset = buffer.readInt32BE(offset); // Signed
                        break;
                    default:
                        throw new Error("Unsupported version of trun box: " + superBox.version);
                }
                offset += 4;
            }
            samples.push({
                duration,
                size,
                flags,
                compositionTimeOffset,
            });
        }
        this.decodedBytes = offset;
        return {
            ...superBox,
            dataOffset,
            firstSampleFlags,
            samples,
        };
    }

}

export const trun = new TrackRunBoxEncoding();
