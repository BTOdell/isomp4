import type {Buffer} from "buffer";
import type {BoxHeader, FullBox} from "@isomp4/core";
import {FullBoxEncoding} from "@isomp4/core";

export interface MovieFragmentHeaderBox extends FullBox {
    sequenceNumber: number;
}

class MovieFragmentHeaderBoxEncoding extends FullBoxEncoding {

    constructor() {
        super("mfhd");
    }

    public override encodingLength(obj: MovieFragmentHeaderBox): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: MovieFragmentHeaderBox, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        // let offset = this.encodedBytes;
        // // TODO implementing encoding
        // this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): MovieFragmentHeaderBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let offset: number = this.decodedBytes;
        if (buffer.length < offset + 4) {
            return offset + 4;
        }
        const sequenceNumber: number = buffer.readUInt32BE(offset);
        offset += 4;
        this.decodedBytes = offset;
        return {
            ...superBox,
            sequenceNumber,
        };
    }

}

export const mfhd = new MovieFragmentHeaderBoxEncoding();
