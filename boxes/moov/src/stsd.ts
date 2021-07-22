import type {Buffer} from "buffer";
import type {BoxHeader, FourCC, FullBox} from "@isomp4/core";
import {BoxContainer, FullBoxEncoding} from "@isomp4/core";
import type {AVCBox} from "./samples/avc.js";
import {avc1, avc2, avc3, avc4, getAVCCodec} from "./samples/avc.js";

export interface SampleDescriptionBox extends FullBox {
}

class SampleDescriptionBoxEncoding extends FullBoxEncoding {

    public override readonly type: FourCC = "stsd";

    constructor() {
        super("stsd", avc1, avc2, avc3, avc4);
    }

    public override encodingLength(obj: SampleDescriptionBox): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: SampleDescriptionBox, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        // let offset = this.encodedBytes;
        // // TODO implementing encoding
        // this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): SampleDescriptionBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let offset: number = this.decodedBytes;
        if (buffer.length < offset + 4) {
            return offset + 4;
        }
        offset += 4; // skip entry count
        this.decodedBytes = offset;
        return {
            ...superBox,
        };
    }

}

/**
 * Gets the visual codec (e.g. avc1.4d0029) from the given sample description box.
 *
 * Note: The sample description box must be fully parsed, including all children.
 * This function may throw an error if the children are not fully parsed,
 * or if the box is malformed (missing required sample entry children).
 *
 * @param stsd The sample description box to search.
 * @return The codec of the visual sample entry in the box.
 */
export function getVideoCodec(stsd: SampleDescriptionBox): string {
    if (!BoxContainer.isInstance(stsd)) {
        throw new Error("stsd children not fully decoded yet");
    }
    let avcBox: AVCBox | undefined;
    for (const sampleEntryType of ["avc1", "avc2", "avc3", "avc4"]) {
        if (Object.prototype.hasOwnProperty.call(stsd.children, sampleEntryType)) {
            const sampleEntries = stsd.children[sampleEntryType];
            if (sampleEntries.length > 0) {
                if (sampleEntries.length > 1) {
                    throw new Error("stsd box contains multiple entries for box type: " + sampleEntryType);
                }
                avcBox = sampleEntries[0] as AVCBox;
            }
        }
    }
    if (avcBox != null) {
        return avcBox.type + "." + getAVCCodec(avcBox.config);
    }
    // Exhausted all known visual sample types
    throw new Error("unable to find visual sample entry in stsd box");
}

export const stsd = new SampleDescriptionBoxEncoding();
