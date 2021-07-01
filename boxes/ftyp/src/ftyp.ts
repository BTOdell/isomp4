import type {Buffer} from "buffer";
import type {Box, BoxEncoding, FourCC} from "@isomp4/core";
import {AbstractBoxEncoding, BoxHeader, readFourCC} from "@isomp4/core";

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
        // TODO
        throw "implement";
    }

    public override decodeWithHeader(buffer: Buffer, header: BoxHeader): FileTypeBox | number {
        const contentLength: number = header.size - BoxHeader.encodingLength(header);
        if (buffer.length < contentLength) {
            return contentLength;
        }
        const majorBrand: FourCC = readFourCC(buffer, 0);
        const minorVersion: number = buffer.readUInt32BE(4);
        const compatibleBrands: FourCC[] = [];
        for (let i = 8; i < contentLength; i += 4) {
            compatibleBrands.push(readFourCC(buffer, i));
        }
        this.decodedBytes = contentLength;
        return {
            ...header,
            majorBrand,
            minorVersion,
            compatibleBrands,
        };
    }

}();
