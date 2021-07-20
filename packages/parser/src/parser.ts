import {Buffer} from "buffer";
import type {Box, BoxEncoding, FourCC} from "@isomp4/core";
import {BoxContainer, BoxHeader} from "@isomp4/core";

const EMPTY_BUFFER = Buffer.allocUnsafe(0);

interface BoxState {

    /**
     *
     */
    readonly header: BoxHeader;

    /**
     *
     */
    readonly box: Box | null;

    /**
     *
     */
    readonly children: boolean;

    /**
     *
     */
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
     * The current box state.
     * If this is <code>null</code>, then a box header will be parsed next.
     */
    private currentBox: {
        readonly header: BoxHeader,
        readonly headerLength: number,
        content: boolean,
    } | null;

    /**
     * Creates a new parser for an MP4 stream.
     */
    protected constructor() {
        this.boxes = new Map();
        this.boxStack = [];
        this.buffer = EMPTY_BUFFER;
        this.bytesNeeded = 0;
        this.currentBox = null;
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
                const bytesConsumed: number = this.processBuffer(buf);
                if (this.bytesNeeded > 0) {
                    // More bytes are needed
                    continue;
                }
                if (bytesConsumed !== bytesNeeded) {
                    throw new Error(`bytes consumed(${bytesConsumed}) != bytes needed(${bytesNeeded})`);
                }
                // Reset buffer
                this.buffer = Buffer.from(this.buffer.buffer);
            } else {
                // Avoid copying data by using the input buffer directly
                const consumed: number = this.processBuffer(input);
                if (consumed > 0) {
                    input = input.slice(consumed);
                }
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
     * @return The number of bytes consumed.
     */
    private processBuffer(buffer: Buffer): number {
        stackCheck: if (this.boxStack.length > 0) {
            const top: BoxState = this.boxStack[this.boxStack.length - 1];
            const header = top.header;
            const needed: number = header.size - top.offset;
            if (needed > 0) {
                if (top.children) {
                    // Skip and parse children normally
                    break stackCheck;
                }
                const available: number = buffer.length;
                if (needed > available) {
                    // Don't have enough data
                    this.onBoxData(header, buffer);
                    top.offset += available;
                    return available;
                }
                // Have enough data
                this.onBoxData(header, buffer.slice(0, needed));
            }
            // End box
            if (top.box != null) {
                this.onBoxEnded(header, top.box);
            } else {
                this.onBoxEnded(header);
            }
            // Pop box state
            this.boxStack.pop();
            // Check next box state
            if (this.boxStack.length > 0) {
                const next = this.boxStack[this.boxStack.length - 1];
                next.offset += header.size;
                if (top.box != null && next.box != null && BoxContainer.isInstance(next.box)) {
                    BoxContainer.add(next.box, top.box);
                }
            }
            // Trigger parsing of next box
            this.currentBox = null;
            return needed;
        }
        if (this.currentBox == null) {
            const header: BoxHeader | number = BoxHeader.parse(buffer);
            if (typeof header === "number") {
                this.bytesNeeded = header;
                return 0;
            }
            const headerLength = BoxHeader.decodedBytes;
            // Invoke box started event
            const content = this.onBoxStarted(header, buffer.slice(0, headerLength));
            // Start box
            this.currentBox = {
                header,
                headerLength,
                content,
            };
            return headerLength;
        }
        const header: BoxHeader = this.currentBox.header;
        if (this.currentBox.content) {
            const encoding: BoxEncoding | undefined = this.boxes.get(header.type);
            if (encoding != null) {
                const box = encoding.decode(buffer, header);
                if (typeof box === "number") {
                    this.bytesNeeded = box;
                    return 0;
                }
                const consumed = encoding.decodedBytes;
                // Invoke box decoded event
                const children = this.onBoxDecoded(box, buffer.slice(0, consumed));
                // Push box onto stack (and record whether to parse children)
                this.boxStack.push({
                    header,
                    box,
                    children,
                    offset: this.currentBox.headerLength + consumed,
                });
                // Trigger parsing of child boxes
                if (children) {
                    (box as BoxContainer).children = {};
                    this.currentBox = null;
                }
                return consumed;
            }
            // No encoding, so reset content boolean
            this.currentBox.content = false;
        }
        // No encoding for box type, must skip entire box and children
        this.boxStack.push({
            header,
            box: null,
            children: false,
            offset: this.currentBox.headerLength,
        });
        return this.processBuffer(buffer);
    }

    /**
     * Invoked when a new box starts from the source.
     * @param header The parsed header data of the box.
     * @param headerData The raw header data of the box.
     * @return Whether to decode the box content (fields).
     */
    protected abstract onBoxStarted(header: BoxHeader, headerData: Buffer): boolean;

    /**
     * Invoked when the box content is parsed.
     * This will be invoked if {@link onBoxStarted} returns <code>true</code> for a box
     * and there is a registered box encoding for the box type,
     * otherwise {@link onBoxData} will be invoked with the remaining box data.
     * @param box The box that was parsed.
     * @param boxData The raw content data of the box (excluding header and children).
     * @return Whether to decode the children boxes.
     */
    protected abstract onBoxDecoded(box: Box, boxData: Buffer): boolean;

    /**
     * Invoked when new data is received for the current box.
     * This will be invoked if either {@link onBoxStarted} or {@link onBoxDecoded} return <code>false</code> for a box.
     * @param header The box that the data is for.
     * @param boxData The raw data of the box (excluding header).
     */
    protected abstract onBoxData(header: BoxHeader, boxData: Buffer): void;

    /**
     * Invoked when a box ends.
     * @param header The header of the box that ended.
     * @param box The box that ended, if it was parsed.
     */
    protected abstract onBoxEnded(header: BoxHeader, box?: Box): void;

}

/**
 * An implementation of {@link AbstractMP4Parser} that delegates to optional function properties.
 */
export class MP4Parser extends AbstractMP4Parser {

    public boxStarted?: typeof MP4Parser.prototype.onBoxStarted;
    public boxDecoded?: typeof MP4Parser.prototype.onBoxDecoded;
    public boxData?: typeof MP4Parser.prototype.onBoxData;
    public boxEnded?: typeof MP4Parser.prototype.onBoxEnded;

    /**
     * Create a new MP4Parser.
     */
    constructor() {
        super();
    }

    protected onBoxStarted(header: BoxHeader, headerData: Buffer): boolean {
        return this.boxStarted ? this.boxStarted(header, headerData) : true;
    }

    protected onBoxDecoded(box: Box, boxData: Buffer): boolean {
        return this.boxDecoded ? this.boxDecoded(box, boxData) : true;
    }

    protected onBoxData(header: BoxHeader, boxData: Buffer): void {
        this.boxData?.(header, boxData);
    }

    protected onBoxEnded(header: BoxHeader, box?: Box): void {
        this.boxEnded?.(header, box);
    }

}
