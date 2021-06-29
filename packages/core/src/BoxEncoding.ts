import {Buffer} from "buffer";
import type {Box, BoxHeader, FourCC} from "./Box.js";
import {parseBoxHeader} from "./Box.js";

/**
 *
 */
export interface BoxEncoding<B extends Box = Box> {

    /**
     * Unique box type.
     */
    readonly type: FourCC;

    /**
     *
     */
    readonly encodedBytes: number;

    /**
     *
     */
    readonly decodedBytes: number;

    /**
     *
     * @param obj
     */
    encodingLength(obj: B): number;

    /**
     * Encodes the given box to a buffer.
     * @param obj The box to encode.
     * @return A newly allocated buffer capable of holding the encoded box data.
     */
    encode(obj: B): Buffer;

    /**
     * Encodes the given box into the given buffer.
     * @param obj The box to encode.
     * @param buffer The buffer to write to.
     * @return The number of bytes of available space required in the buffer.
     * If <code>0</code>, then the box was successfully written to the buffer.
     */
    encodeTo(obj: B, buffer: Buffer): number;

    /**
     * Decodes the given buffer into a box object.
     * @param buffer The buffer to read from (starting at offset 0).
     * @return A parsed box object,
     * or if there isn't enough data in the buffer, returns the total
     * number of bytes needed to decode the box.
     */
    decode(buffer: Buffer): B | number;

    /**
     *
     * @param header
     * @param buffer
     */
    decodeWithHeader(header: BoxHeader, buffer: Buffer): B | number;

}

/**
 * A base implementation of BoxEncoding.
 */
export abstract class AbstractBoxEncoding<B extends Box = Box> implements BoxEncoding<B> {

    public abstract readonly type: FourCC;

    private _decodedBytes: number = 0;

    public get decodedBytes(): number {
        return this._decodedBytes;
    }

    protected set decodedBytes(value: number) {
        this._decodedBytes = value;
    }

    private _encodedBytes: number = 0;

    public get encodedBytes(): number {
        return this._encodedBytes;
    }

    protected set encodedBytes(value: number) {
        this._encodedBytes = value;
    }

    public abstract encodingLength(obj: B): number;

    public encode(obj: B): Buffer {
        const len: number = this.encodingLength(obj);
        const buf: Buffer = Buffer.alloc(len);
        const required: number = this.encodeTo(obj, buf);
        if (required > 0) {
            throw new Error(`encodingLength(${len}) and encodeTo(${required}) are mismatched`);
        }
        return buf;
    }

    public abstract encodeTo(obj: B, buffer: Buffer): number;

    public decode(buffer: Buffer): B | number {
        const parsedHeader = parseBoxHeader(buffer);
        if (typeof parsedHeader === "number") {
            return parsedHeader;
        }
        const parsedBox = this.decodeWithHeader(parsedHeader, buffer.slice(parsedHeader.headerLength));
        if (typeof parsedBox === "number") {
            return parsedHeader.headerLength + parsedBox;
        }
        return parsedBox;
    }

    public abstract decodeWithHeader(header: BoxHeader, buffer: Buffer): B | number;

}
