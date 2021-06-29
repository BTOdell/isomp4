import type {Buffer} from "buffer";
import type {Box, BoxEncoding, BoxHeader, FourCC} from "@isomp4/core";
import {AbstractBoxEncoding} from "@isomp4/core";

export interface MovieBox extends Box {
}

export const moof: BoxEncoding<MovieBox> = new class extends AbstractBoxEncoding<MovieBox> {

    public override readonly type: FourCC = "moov";

    public override encodingLength(obj: MovieBox): number {
        return 0;
    }

    public override encodeTo(obj: MovieBox, buf: Buffer): number {
        return 0;
    }

    public override decodeWithHeader(header: BoxHeader, buffer: Buffer): MovieBox | number {
        return 0;
    }

}();
