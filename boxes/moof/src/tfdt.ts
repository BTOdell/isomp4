import type {Buffer} from "buffer";
import type {BoxHeader, FullBox} from "@isomp4/core";
import {FullBoxEncoding, readSafeUInt64BE} from "@isomp4/core";

export interface TrackFragmentBaseMediaDecodeTimeBox extends FullBox {
    baseMediaDecodeTime: number;
}

class TrackFragmentBaseMediaDecodeTimeBoxEncoding extends FullBoxEncoding {

    constructor() {
        super("tfdt");
    }

    public override encodingLength(obj: TrackFragmentBaseMediaDecodeTimeBox): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: TrackFragmentBaseMediaDecodeTimeBox, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        // let offset = this.encodedBytes;
        // // TODO implementing encoding
        // this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): TrackFragmentBaseMediaDecodeTimeBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let baseMediaDecodeTime: number;
        let offset: number = this.decodedBytes;
        switch (superBox.version) {
            case 0:
                // 32-bit time
                if (buffer.length < offset + 4) {
                    return offset + 4;
                }
                baseMediaDecodeTime = buffer.readUInt32BE(offset);
                offset += 4;
                break;
            case 1:
                // 64-bit time
                if (buffer.length < offset + 8) {
                    return offset + 8;
                }
                baseMediaDecodeTime = readSafeUInt64BE(buffer, offset);
                offset += 8;
                break;
            default:
                throw new Error("Unsupported version of tfdt box: " + superBox.version);
        }
        this.decodedBytes = offset;
        return {
            ...superBox,
            baseMediaDecodeTime,
        };
    }

}

export const tfdt = new TrackFragmentBaseMediaDecodeTimeBoxEncoding();
