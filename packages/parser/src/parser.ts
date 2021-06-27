import {Buffer} from "buffer";
import type {BoxEncoding, BoxHeader, FourCC} from "@isomp4/core";
import {parseBoxHeader} from "@isomp4/core";

const EMPTY_BUFFER = Buffer.allocUnsafe(0);

interface BoxState {
    readonly size: number;
    readonly type: string | null;
    offset: number;
}

/**
 * Parses the ISO BMFF box structure of an MP4 stream.
 */
export abstract class AbstractMP4Parser {

    /**
     * Registered box encodings.
     */
    private readonly boxes: Map<FourCC, BoxEncoding>;

    /**
     * A stack that keeps track of the current state in the MP4 box structure traversal.
     */
    private readonly boxStack: BoxState[];

    /**
     * A temporary buffer to store appended data before it's parsed.
     * This buffer may be resized if a box requires more space before it can be fully parsed.
     */
    private buffer: Buffer;

    /**
     * The number of bytes needed in the buffer to parse the next part.
     */
    private bytesNeeded: number;

    /**
     * Creates a new parser for an MP4 stream.
     */
    protected constructor() {
        this.boxes = new Map();
        this.boxStack = [];
        this.buffer = EMPTY_BUFFER;
        this.bytesNeeded = 0;
    }

    /**
     *
     * @param encoding
     */
    public registerBox(encoding: BoxEncoding): void {
        if (this.boxes.has(encoding.type)) {
            throw new Error("Box type is already registered: " + encoding.type);
        }
        this.boxes.set(encoding.type, encoding);
    }

    /**
     *
     * @param boxType
     */
    public isBoxRegistered(boxType: FourCC): boolean {
        return this.boxes.has(boxType);
    }

    /**
     * Appends new data to the stream.
     * @param data The new data to append. This data does NOT need to be a complete segment (or even a fragment).
     */
    public append(data: ArrayBufferView): void {
        let input: Buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
        while (input.length > 0) {
            if (this.bytesNeeded > 0) {
                // Ensure that buffer is the correct size
                this.ensureBuffer(this.bytesNeeded);
                // Don't copy more data into the temp buffer than is needed for the next part!
                const needed: number = this.bytesNeeded - this.buffer.byteOffset;
                if (needed > 0) {
                    if (needed <= input.length) {
                        // Only copy 'needed' number of bytes into the temp buffer
                        input.copy(this.buffer, 0, 0, needed);
                        input = input.slice(needed);
                    } else {
                        // All input can be copied into temp buffer
                        this.buffer = this.buffer.slice(input.copy(this.buffer));
                        // More input data is needed
                        return;
                    }
                }
                // Temp buffer now contains all bytes needed
                // Flip buffer
                const bytesNeeded = this.bytesNeeded;
                const buf = Buffer.from(this.buffer.buffer, 0, bytesNeeded);
                this.bytesNeeded = 0; // This must be reset before calling processBuffer()
                const bytesConsumed: number = this.processBuffer(buf).byteOffset;
                if (bytesConsumed !== bytesNeeded) {
                    throw new Error(`bytes consumed(${bytesConsumed}) != bytes needed(${bytesNeeded})`);
                }
                if (this.bytesNeeded > 0) {
                    throw new Error("bytes needed was set");
                }
                // Reset buffer
                this.buffer = Buffer.from(this.buffer.buffer);
            } else {
                // Avoid copying data by using the input buffer directly
                input = this.processBuffer(input);
            }
        }
    }

    private ensureBuffer(capacity: number): void {
        if (this.buffer.buffer.byteLength < capacity) {
            const newBuffer: Buffer = Buffer.alloc(capacity);
            // If the byteOffset is zero, then this indicates that there is no data written to the buffer
            if (this.buffer.byteOffset > 0) {
                // Must copy old buffer to new buffer
                Buffer.from(this.buffer.buffer).copy(newBuffer);
            }
            this.buffer = newBuffer;
        }
    }

    /**
     * Processes the given buffer.
     * @param buffer The input buffer.
     * @return A buffer with consumed bytes being sliced off.
     */
    private processBuffer(buffer: Buffer): Buffer {
        const header: BoxHeader | number = parseBoxHeader(buffer);
        if (typeof header === "number") {
            this.bytesNeeded = header;
        }
        // TODO
        return buffer;
    }

    /**
     * Invoked when a new box starts from the source.
     * @param header The parsed header data of the box.
     * @param headerData The raw header data of the box.
     * @return Whether the traverse the children of this box.
     */
    protected abstract onBoxStarted(header: BoxHeader, headerData: Buffer): void;

    /**
     * Invoked when new data is received for the current box.
     * @param type The type of the current box.
     * @param data The data of the box.
     */
    protected abstract onBoxData(type: string, data: Buffer): void;

    /**
     * Invoked when the current box ends.
     * @param type The type of the box that ended.
     */
    protected abstract onBoxEnded(type: string): void;

}

/**
 * An implementation of {@link AbstractMP4Parser} that delegates to optional function properties.
 */
export class MP4Parser extends AbstractMP4Parser {

    public boxStarted?: typeof MP4Parser.prototype.onBoxStarted;
    public boxData?: typeof MP4Parser.prototype.onBoxData;
    public boxEnded?: typeof MP4Parser.prototype.onBoxEnded;

    protected onBoxStarted(header: BoxHeader, headerData: Buffer): void {
        this.boxStarted?.(header, headerData);
    }

    protected onBoxData(type: string, data: Buffer): void {
        this.boxData?.(type, data);
    }

    protected onBoxEnded(type: string): void {
        this.boxEnded?.(type);
    }

}
