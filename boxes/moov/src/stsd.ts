import type {Buffer} from "buffer";
import type {BoxHeader, FourCC, FullBox} from "@isomp4/core";
import {FullBoxEncoding} from "@isomp4/core";

export interface SampleDescriptionBox extends FullBox {
}

class SampleDescriptionBoxEncoding extends FullBoxEncoding {

    public override readonly type: FourCC = "stsd";

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

export const stsd = new SampleDescriptionBoxEncoding();
