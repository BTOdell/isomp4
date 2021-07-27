import type {Buffer} from "buffer";
import type {BoxHeader, FourCC, FullBox} from "@isomp4/core";
import {FullBoxEncoding} from "@isomp4/core";
import {readString} from "@isomp4/core/src/BufferUtils";

export interface HandlerBox extends FullBox {

    /**
     * The type of media handler for the track.
     *
     * Common types:
     * * `vide`
     * * `soun`
     * * `auxv`
     * * `meta`
     * * `hint`
     * * `text`
     * * `subt`
     * * `fdsm`
     */
    handlerType: "vide" | "soun" | "auxv" | "meta" | "hint" | "text" | "subt" | "fdsm" | FourCC;

    /**
     * A human-readable name for the track type.
     */
    name: string;

}

class HandlerBoxEncoding extends FullBoxEncoding {

    constructor() {
        super("hdlr");
    }

    public override encodingLength(obj: HandlerBox): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: HandlerBox, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        // let offset = this.encodedBytes;
        // // TODO implementing encoding
        // this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): HandlerBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let offset: number = this.decodedBytes;
        // Assume there are no child boxes of hdlr
        const end: number = HandlerBoxEncoding.end(superBox, header);
        if (buffer.length < end) {
            return end;
        }
        offset += 4; // pre_defined = 0
        const handlerType: FourCC = buffer.toString("binary", offset, offset += 4);
        offset += 12; // reserved = 0
        const name: string | number = readString(buffer, offset);
        if (typeof name === "number") {
            return offset + name;
        }
        offset += readString.decodedBytes;
        this.decodedBytes = offset;
        return {
            ...superBox,
            handlerType,
            name,
        };
    }

}

export const hdlr = new HandlerBoxEncoding();
