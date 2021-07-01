import {Buffer} from "buffer";
import {MAX_SAFE_BIGINT} from "./BufferUtils.js";

/**
 * Represents a four-character code.
 */
export type FourCC = string;

/**
 * Reads a four-character code from the given buffer at the given index.
 * @param buffer The buffer to read from.
 * @param i The index to read from in the buffer.
 */
export function readFourCC(buffer: Buffer, i: number): FourCC {
    const fourCC: FourCC = buffer.toString("binary", i, i + 4);
    if (fourCC.length !== 4) {
        throw new Error("Buffer does not contain enough bytes to read FourCC at index: " + i);
    }
    return fourCC;
}

/**
 * The length (in bytes) of a compact box header in the ISO base media file format.
 * This header includes the 32-bit unsigned `size` field and the 32-bit unsigned `type` field.
 * @see ISO/IEC 14496-12.
 */
const BOX_HEADER_LENGTH: number = 8;

/**
 * The header fields of a box structure.
 */
export interface BoxHeader {

    /**
     * The number of bytes of the entire box, including header, fields, and children.
     */
    readonly size: number;

    /**
     * The unique four-character code representing the type of the box.
     * Common types are: ftyp, moov, moof, mdat
     */
    readonly type: FourCC;

    /**
     * 64-bit extended size of the box.
     */
    readonly largesize?: bigint;

    /**
     * 16-byte UUID for custom user types.
     */
    readonly usertype?: Buffer;

}

export namespace BoxHeader {

    /**
     * The number of bytes that were decoded by the last call to {@link BoxHeader#parse}.
     */
    export let decodedBytes: number;

    /**
     * Calculates the length (in bytes) of the given box header object.
     * @param header The box header object.
     * @return The number of bytes that are required to encode the given header.
     */
    export function encodingLength(header: BoxHeader): number {
        let len = BOX_HEADER_LENGTH;
        if (header.largesize != null) {
            len += 8;
        }
        if (header.type === "uuid") {
            len += 16;
        }
        return len;
    }

    /**
     * Parses the given buffer into a box header object.
     * @param buffer The buffer to read from (starting at offset 0).
     * @return A parsed box header object,
     * or if there isn't enough data in the buffer, returns the total
     * number of bytes needed to read the box header.
     */
    export function parse(buffer: Buffer): BoxHeader | number {
        let headerLength: number = BOX_HEADER_LENGTH;
        // 'size' and 'type' are always required
        if (buffer.length < headerLength) {
            return headerLength;
        }
        let size: number = buffer.readUInt32BE(0);
        const type: FourCC = buffer.toString("binary", 4, 8);
        let offset: number = 8;
        let largesize: bigint | undefined;
        if (size === 0) {
            throw new Error("box cannot extend indefinitely");
        } else if (size === 1) {
            if (buffer.length < (headerLength += 8)) {
                return headerLength;
            }
            largesize = buffer.readBigUInt64BE(offset).valueOf();
            if (largesize > MAX_SAFE_BIGINT) {
                throw new Error("largesize mode is not supported");
            }
            offset += 8;
            // If the largesize can be stored in the normal size, then do so
            size = Number(largesize);
        } else if (size < headerLength) {
            throw new Error("invalid box size: " + size);
        } else if (size === headerLength) {
            throw new Error("empty box not supported");
        }
        // Check for user-defined type
        let usertype: Buffer | undefined;
        if (type === "uuid") {
            if (buffer.length < (headerLength += 16)) {
                return headerLength;
            }
            usertype = Buffer.from(buffer.slice(offset, offset + 16));
        }
        BoxHeader.decodedBytes = headerLength;
        return {
            size,
            type,
            largesize,
            usertype,
        };
    }

}

export interface Box extends BoxHeader {}

/**
 * The header fields of a full box structure.
 */
export interface FullBoxHeader {

    /**
     * Specifies the version of this format of the box.
     */
    readonly version: number;

    /**
     * A bitfield of custom flags.
     */
    readonly flags: number;

}

export namespace FullBoxHeader {

    /**
     * The number of bytes that were decoded by the last call to {@link FullBoxHeader#parse}.
     */
    export let decodedBytes: number;

    /**
     * Parses the given buffer into a full box header object.
     * @param buffer The buffer to read from (starting at offset 0).
     * @return A parsed full box header object,
     * or if there isn't enough data in the buffer, returns the total
     * number of bytes needed to read the full box header.
     */
    export function parse(buffer: Buffer): FullBoxHeader | number {
        if (buffer.length < 4) {
            return 4;
        }
        const version: number = buffer.readUInt8(0);
        const flags: number = buffer.readUIntBE(1, 3);
        FullBoxHeader.decodedBytes = 4;
        return {
            version,
            flags,
        };
    }

}

export interface FullBox extends Box, FullBoxHeader {}

export interface BoxContainer {
    children: {
        [type: string]: Box | Box[],
    };
}
