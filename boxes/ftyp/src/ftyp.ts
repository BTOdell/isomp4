import type {Buffer} from "buffer";
import type {Box, BoxEncoding, BoxHeader, FourCC} from "@isomp4/core";
import {AbstractBoxEncoding, readFourCC} from "@isomp4/core";

export interface FileTypeBox extends Box {
    readonly majorBrand: FourCC;
    readonly minorVersion: number;
    readonly compatibleBrands: readonly FourCC[];
}

export const ftyp: BoxEncoding<FileTypeBox> = new class extends AbstractBoxEncoding<FileTypeBox> {

    public override readonly type: FourCC = "ftyp";

    public override encodingLength(obj: FileTypeBox): number {
        return 8 + obj.compatibleBrands.length * 4;
    }

    public override encodeTo(obj: FileTypeBox, buffer: Buffer): number {
        throw "implement";
    }

    public override decodeWithHeader(header: BoxHeader, buffer: Buffer): FileTypeBox | number {
        const contentLength: number = header.size - header.headerLength;
        if (buffer.length < contentLength) {
            return contentLength;
        }
        const majorBrand: FourCC = readFourCC(buffer, 0);
        const minorVersion: number = buffer.readUInt32BE(4);
        const compatibleBrands: FourCC[] = [];
        for (let i = 8; i < contentLength; i += 4) {
            compatibleBrands.push(readFourCC(buffer, i));
        }
        return {
            ...header,
            length: header.size, // ftyp has no children
            majorBrand,
            minorVersion,
            compatibleBrands,
        };
    }

}();
