import type {Buffer} from "buffer";
import type {Box, BoxEncoding, BoxHeader, FourCC} from "@isomp4/core";
import {AbstractBoxEncoding} from "@isomp4/core";

export interface FileTypeBox extends Box {
    readonly majorBrand: FourCC;
    readonly minorBrand: FourCC;
    readonly compatibleBrands: readonly FourCC[];
}

export const ftyp: BoxEncoding<FileTypeBox> = new class extends AbstractBoxEncoding<FileTypeBox> {

    public override readonly type: FourCC = "ftyp";

    public override encodingLength(obj: FileTypeBox): number {
        return 0;
    }

    public override encodeTo(obj: FileTypeBox, buf: Buffer): number {
        return 0;
    }

    public override decodeWithHeader(header: BoxHeader, buffer: Buffer): FileTypeBox | number {
        return 0;
    }

}();
