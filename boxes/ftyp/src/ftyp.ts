import type {Buffer} from "buffer";
import type {Box, FourCC} from "@isomp4/core";
import {BoxEncoding, BoxHeader, readFourCC} from "@isomp4/core";

export interface FileTypeBox extends Box {
    readonly majorBrand: FourCC;
    readonly minorVersion: number;
    readonly compatibleBrands: readonly FourCC[];
}

class FileTypeBoxEncoding extends BoxEncoding {

    public override readonly type: FourCC = "ftyp";

    public override encodingLength(obj: FileTypeBox): number {
        return super.encodingLength(obj) +
            8 + obj.compatibleBrands.length * 4;
    }

    public override encodeTo(obj: FileTypeBox, buffer: Buffer): number {
        // TODO
        throw "implement";
    }

    public override decode(buffer: Buffer, header?: BoxHeader): FileTypeBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        const offset: number = this.decodedBytes;
        const end: number = offset > 0 ? superBox.size : superBox.size - super.encodingLength(superBox);
        if (buffer.length < end) {
            return end;
        }
        const majorBrand: FourCC = readFourCC(buffer, offset);
        const minorVersion: number = buffer.readUInt32BE(offset + 4);
        const compatibleBrands: FourCC[] = [];
        for (let i = offset + 8; i < end; i += 4) {
            compatibleBrands.push(readFourCC(buffer, i));
        }
        this.decodedBytes = end;
        return {
            ...superBox,
            majorBrand,
            minorVersion,
            compatibleBrands,
        };
    }

}

export const ftyp = new FileTypeBoxEncoding();
