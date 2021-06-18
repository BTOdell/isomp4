import {Buffer} from "buffer";

type InitBoxType = "ftyp" | "moov";
type MediaBoxType = "moof" | "mdat";

/**
 * A supported FourCC ("four-character code") box type.
 */
export type BoxType = InitBoxType | MediaBoxType;

/**
 * The size (in bytes) of a compact box header in the ISO base media file format.
 * This header includes the 32-bit unsigned `size` field and the 32-bit unsigned `type` field.
 * @see ISO/IEC 14496-12.
 */
const BOX_HEADER_SIZE: number = 8;

/**
 * Determines if the given string is a supported box type.
 * @param type The type to check.
 */
export function isSupportedBoxType(type: string): type is BoxType {
    switch (type) {
        case "ftyp":
        case "moov":
        case "moof":
        case "mdat":
            return true;
    }
    return false;
}

/**
 * Parses top-level boxes of a fragmented MP4 stream.
 * @see https://www.w3.org/TR/mse-byte-stream-format-isobmff/
 *
 * From the ISO BMFF specification, only "ftyp", "moov", "moof", and "mdat" are supported box types.
 * All other box types will be ignored.
 */
export abstract class AbstractMP4Parser {

    /**
     * A buffer to store a compact box header.
     */
    private readonly boxHeaderBuffer: Buffer;

    /**
     * The current offset into the box header buffer to write data.
     * This also acts as the number of bytes written to the box header buffer.
     */
    private boxHeaderOffset: number;

    /**
     * The box that is currently being processed.
     */
    private currentBox: {
        readonly size: number,
        readonly type: BoxType | null,
        offset: number,
    } | null;

    /**
     * Creates a new parser for a fragmented MP4 stream.
     */
    protected constructor() {
        this.boxHeaderBuffer = Buffer.alloc(BOX_HEADER_SIZE);
        this.boxHeaderOffset = 0;
        this.currentBox = null;
    }

    /**
     * Appends new data to the stream.
     * @param data The new data to append. This data does NOT need to be a complete segment (or even a fragment).
     */
    public append(data: ArrayBufferView): void {
        // Handle main MP4 box parsing
        const buf: Buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
        let offset: number = 0;
        let available: number;
        while ((available = buf.byteLength - offset) > 0) {
            if (this.currentBox != null) {
                // Pass through box data
                const needed: number = this.currentBox.size - this.currentBox.offset;
                const transfer: number = Math.min(available, needed);
                const newOffset: number = offset + transfer;
                if (this.currentBox.type != null) {
                    const boxData: Buffer = buf.slice(offset, newOffset);
                    this.onBoxData(this.currentBox.type, boxData);
                }
                this.currentBox.offset += transfer;
                offset = newOffset;
                // Once passed the box data, signal end of box and reset for next box
                if (this.currentBox.offset >= this.currentBox.size) {
                    if (this.currentBox.type != null) {
                        this.onBoxEnded(this.currentBox.type);
                    }
                    this.currentBox = null;
                }
            } else {
                // Write data into box header buffer until full
                {
                    const needed: number = this.boxHeaderBuffer.byteLength - this.boxHeaderOffset;
                    const transfer: number = Math.min(available, needed);
                    const newOffset: number = offset + transfer;
                    buf.copy(this.boxHeaderBuffer, this.boxHeaderOffset, offset, newOffset);
                    this.boxHeaderOffset += transfer;
                    offset = newOffset;
                }
                // Once full, create current box from buffer data
                if (this.boxHeaderOffset >= this.boxHeaderBuffer.byteLength) {
                    const size: number = this.boxHeaderBuffer.readUInt32BE(0);
                    const type: string = this.boxHeaderBuffer.toString("binary", 4, 8);
                    if (size === 0) {
                        throw new Error("Box cannot extend indefinitely.");
                    } else if (size === 1) {
                        throw new Error("Largesize mode is not supported.");
                    } else if (size < BOX_HEADER_SIZE) {
                        throw new Error("Invalid box size: " + size);
                    } else if (size === BOX_HEADER_SIZE) {
                        throw new Error("Empty box not supported.");
                    }
                    const boxType: BoxType | null = isSupportedBoxType(type) ? type : null;
                    this.currentBox = {
                        size: size,
                        type: boxType,
                        offset: BOX_HEADER_SIZE,
                    };
                    // Invoke box start event
                    if (boxType != null) {
                        this.onBoxStarted(size, boxType, this.boxHeaderBuffer);
                    }
                    // Reset box header
                    this.boxHeaderOffset = 0;
                }
            }
        }
    }

    /**
     * Invoked when a new box starts from the source.
     * @param size The size of the box.
     * @param type The type of the box.
     * @param header The raw header data of the box.
     */
    protected abstract onBoxStarted(size: number, type: BoxType, header: Buffer): void;

    /**
     * Invoked when new data is received for the current box.
     * @param type The type of the current box.
     * @param data The data of the box.
     */
    protected abstract onBoxData(type: BoxType, data: Buffer): void;

    /**
     * Invoked when the current box ends.
     * @param type The type of the box that ended.
     */
    protected abstract onBoxEnded(type: BoxType): void;

}

/**
 * An implementation of {@link AbstractMP4Parser} that delegates to optional function properties.
 */
export class MP4Parser extends AbstractMP4Parser {

    public boxStarted?: typeof MP4Parser.prototype.onBoxStarted;
    public boxData?: typeof MP4Parser.prototype.onBoxData;
    public boxEnded?: typeof MP4Parser.prototype.onBoxEnded;

    protected onBoxStarted(size: number, type: BoxType, header: Buffer): void {
        this.boxStarted?.(size, type, header);
    }

    protected onBoxData(type: BoxType, data: Buffer): void {
        this.boxData?.(type, data);
    }

    protected onBoxEnded(type: BoxType): void {
        this.boxEnded?.(type);
    }

}
