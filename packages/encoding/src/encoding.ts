import type {Buffer} from "buffer";

type EncodeFunction = {

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
    (obj: object, buf?: Buffer, off?: number): Buffer,

};

type DecodeFunction = {

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
    (buffer: Buffer, start?: number, end?: number): object,

};

/**
 *
 */
export interface Encoding {

    encode: EncodeFunction;

    decode: DecodeFunction;

    /**
     *
     * @param obj
     */
    encodingLength(obj: object): number;

}
