import type {Buffer} from "buffer";
import type {Box, BoxHeader, FourCC} from "@isomp4/core";
import {BoxEncoding} from "@isomp4/core";

export interface MovieFragmentBox extends Box {
}

class MovieFragmentBoxEncoding extends BoxEncoding {

    public override readonly type: FourCC = "moof";

    public override encodingLength(obj: MovieFragmentBox): number {
        return 0;
    }

    public override encodeTo(obj: MovieFragmentBox, buf: Buffer): number {
        // TODO
        throw "implement";
    }

    public override decode(buffer: Buffer, header?: BoxHeader): MovieFragmentBox | number {
        return 0;
    }

}

export const moof = new MovieFragmentBoxEncoding();
