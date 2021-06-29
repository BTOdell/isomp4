import {Buffer} from "buffer";

/**
 * The length (in bytes) of a compact box header in the ISO base media file format.
 * This header includes the 32-bit unsigned `size` field and the 32-bit unsigned `type` field.
 * @see ISO/IEC 14496-12.
 */
export const BOX_HEADER_LENGTH: number = 8;

const MAX_LARGE_SIZE: bigint = BigInt(Number.MAX_SAFE_INTEGER);

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
 * The header fields of a box structure.
 */
export interface BoxHeader {

    /**
     * The length (in bytes) of just this header.
     */
    readonly headerLength: number;

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

export interface Box extends BoxHeader {

    /**
     * The length (in bytes) of the box (excluding the children).
     */
    readonly length: number;

}

/**
 * Parses the given buffer into a box header object.
 * @param buffer The buffer to read from (starting at offset 0).
 * @return A parsed box header object,
 * or if there isn't enough data in the buffer, returns the total
 * number of bytes needed to read the box header.
 */
export function parseBoxHeader(buffer: Buffer): BoxHeader | number {
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
        if (largesize > MAX_LARGE_SIZE) {
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
    return {
        headerLength,
        size,
        type,
        largesize,
        usertype,
    };
}

/**
 * The header fields of a full box structure.
 */
export interface FullBoxHeader {

    /**
     * The length (in bytes) of just this header.
     */
    readonly fullHeaderLength: number;

    /**
     * Specifies the version of this format of the box.
     */
    readonly version: number;

    /**
     * A bitfield of custom flags.
     */
    readonly flags: number;

}

export interface FullBox extends Box, FullBoxHeader {}

/**
 * Parses the given buffer into a full box header object.
 * @param buffer The buffer to read from (starting at offset 0).
 * @return A parsed full box header object,
 * or if there isn't enough data in the buffer, returns the total
 * number of bytes needed to read the full box header.
 */
export function parseFullBoxHeader(buffer: Buffer): FullBoxHeader | number {
    if (buffer.length < 4) {
        return 4;
    }
    const version: number = buffer.readUInt8(0);
    const flags: number = buffer.readUIntBE(1, 3);
    return {
        fullHeaderLength: 4,
        version,
        flags,
    };
}

export interface BoxContainer {
    children: {
        [type: string]: Box | Box[],
    };
}
