import type {Buffer} from "buffer";
import type {Box, BoxHeader, FourCC} from "@isomp4/core";
import {BoxEncoding} from "@isomp4/core";

export interface MediaDataBox extends Box {
}

class MediaDataBoxEncoding extends BoxEncoding {

    public override readonly type: FourCC = "mdat";

    public override encodingLength(obj: MediaDataBox): number {
        return 0;
    }

    public override encodeTo(obj: MediaDataBox, buf: Buffer): number {
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): MediaDataBox | number {
        return 0;
    }

}

export const mdat = new MediaDataBoxEncoding();
