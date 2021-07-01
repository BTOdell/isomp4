import type {Buffer} from "buffer";

/**
 * The maximum bigint value that can be safely converted to a number.
 */
export const MAX_SAFE_BIGINT: bigint = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Reads an unsigned 64-bit integer and attempts to convert it safely to a number primitive.
 */
export function readSafeUInt64BE(buffer: Buffer, offset: number): number {
    const value: bigint = buffer.readBigUInt64BE(offset).valueOf();
    if (value > MAX_SAFE_BIGINT) {
        throw new Error("unable to read 64-bit integer as number: " + value);
    }
    return Number(value);
}

/**
 * The number of milliseconds between 1904/01/01 and 1970/01/01 (at midnight, 00:00).
 */
const TIME_OFFSET_MILLIS: number = 2_082_844_800_000;

/**
 * Reads a 64-bit date from the given buffer.
 * Note: The JavaScript Date object cannot handle
 * @param buffer The buffer to read from.
 * @param offset The offset in the buffer to read from.
 */
export function readDate64(buffer: Buffer, offset: number): Date {
    return new Date(readSafeUInt64BE(buffer, offset) * 1000 - TIME_OFFSET_MILLIS);
}

/**
 * Reads a 32-bit date from the given buffer.
 * @param buffer The buffer to read from.
 * @param offset The offset in the buffer to read from.
 */
export function readDate(buffer: Buffer, offset: number): Date {
    return new Date(buffer.readUInt32BE(offset) * 1000 - TIME_OFFSET_MILLIS);
}

/**
 * Reads and converts a 32-bit fixed point number (16.16) into a number primitive.
 * @param buffer The buffer to read from.
 * @param offset The offset in the buffer to read from.
 */
export function readFixed16x16(buffer: Buffer, offset: number): number {
    return buffer.readUInt16BE(offset) + buffer.readUInt16BE(offset + 2) / 0x10000;
}

/**
 * Reads and converts a 16-bit fixed point number (8.8) into a number primitive.
 * @param buffer The buffer to read from.
 * @param offset The offset in the buffer to read from.
 */
export function readFixed8x8(buffer: Buffer, offset: number): number {
    return buffer[offset] + buffer[offset + 1] / 0x100;
}

/**
 * Reads a matrix (an array) of 32-bit fixed point numbers (16x16).
 * @param buffer The buffer to read from.
 * @param offset The offset in the buffer to read from.
 * @param n The number of elements (32-bit numbers) to read.
 */
export function readMatrix(buffer: Buffer, offset: number, n: number): number[] {
    const mat: number[] = [];
    for (let i = 0; i < n; i++) {
        mat.push(readFixed16x16(buffer, offset + i * 4));
    }
    return mat;
}
