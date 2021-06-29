import type {Buffer} from "buffer";
import type {Box, BoxEncoding, BoxHeader, FourCC} from "@isomp4/core";
import {AbstractBoxEncoding} from "@isomp4/core";

export interface MovieFragmentBox extends Box {
}

export const moof: BoxEncoding<MovieFragmentBox> = new class extends AbstractBoxEncoding<MovieFragmentBox> {

    public override readonly type: FourCC = "moof";

    public override encodingLength(obj: MovieFragmentBox): number {
        return 0;
    }

    public override encodeTo(obj: MovieFragmentBox, buf: Buffer): number {
        return 0;
    }

    public override decodeWithHeader(header: BoxHeader, buffer: Buffer): MovieFragmentBox | number {
        return 0;
    }

}();
