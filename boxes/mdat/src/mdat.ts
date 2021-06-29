import type {Buffer} from "buffer";
import type {Box, BoxEncoding, BoxHeader, FourCC} from "@isomp4/core";
import {AbstractBoxEncoding} from "@isomp4/core";

export interface MediaDataBox extends Box {
}

export const mdat: BoxEncoding<MediaDataBox> = new class extends AbstractBoxEncoding<MediaDataBox> {

    public override readonly type: FourCC = "mdat";

    public override encodingLength(obj: MediaDataBox): number {
        return 0;
    }

    public override encodeTo(obj: MediaDataBox, buf: Buffer): number {
        return 0;
    }

    public override decodeWithHeader(header: BoxHeader, buffer: Buffer): MediaDataBox | number {
        return 0;
    }

}();
