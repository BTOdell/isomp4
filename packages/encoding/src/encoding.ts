import type {Buffer} from "buffer";

type EncodeFunction<O> = {

    /**
     *
     */
    bytes: number,

    /**
     *
     * @param obj
     * @param buf
     * @param off
     */
    (obj: O, buf?: Buffer, off?: number): Buffer,

};

type DecodeFunction<O> = {

    /**
     *
     */
    bytes: number,

    /**
     *
     * @param buffer
     * @param start
     * @param end
     */
    (buffer: Buffer, start?: number, end?: number): O,

};

/**
 *
 */
export interface Encoding<O> {

    encode: EncodeFunction<O>;

    decode: DecodeFunction<O>;

    /**
     *
     * @param obj
     */
    encodingLength(obj: O): number;

}
