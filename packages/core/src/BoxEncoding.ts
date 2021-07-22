import {Buffer} from "buffer";
import type {Box, FourCC, FullBox} from "./Box.js";
import {BoxHeader, FullBoxHeader} from "./Box.js";

/**
 * A base factory for encoding and decoding boxes.
 */
export class BoxEncoding {

    /**
     * Unique box type.
     */
    public readonly type: FourCC;

    private readonly _children: Map<FourCC, BoxEncoding> = new Map();

    /**
     * The encodings of this box's child boxes.
     */
    public get children(): readonly BoxEncoding[] {
        return Array.from(this._children.values());
    }

    private _parent?: BoxEncoding;

    /**
     * The encoding of this box's parent box.
     */
    public get parent(): BoxEncoding | undefined {
        return this._parent;
    }

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

    /**
     * Creates a new encoding for a box.
     * @param type The FourCC-type of the box.
     * @param children The encodings of the child boxes.
     */
    constructor(type: FourCC, ...children: readonly BoxEncoding[]) {
        this.type = type;
        for (const childEncoding of children) {
            if (childEncoding._parent != null) {
                throw new Error("Child encoding '" + childEncoding.type + "' already has parent encoding: " + childEncoding._parent.type);
            }
            childEncoding._parent = this;
            if (this._children.has(childEncoding.type)) {
                throw new Error("Box encoding '" + this.type + "' already has child encoding: " + childEncoding.type);
            }
            this._children.set(childEncoding.type, childEncoding);
        }
    }

    /**
     * Gets the child encoding with the given type.
     * @param type The FourCC type of the child box to get the encoding for.
     */
    public getChild(type: FourCC): BoxEncoding | undefined {
        return this._children.get(type);
    }

    /**
     * Executes the given callback with each child encoding.
     * @param callback The callback function to invoke with each encoding.
     */
    public forEachChild(callback: (encoding: BoxEncoding) => void): void {
        this._children.forEach(e => callback(e));
    }

    public encodingLength(obj: Box): number {
        return BoxHeader.encodingLength(obj);
    }

    /**
     * Encodes the given box to a buffer.
     * @param obj The box to encode.
     * @return A newly allocated buffer capable of holding the encoded box data.
     */
    public encode(obj: Box): Buffer {
        const len: number = this.encodingLength(obj);
        const buf: Buffer = Buffer.alloc(len);
        const required: number = this.encodeTo(obj, buf);
        if (required > 0) {
            throw new Error(`encodingLength(${len}) and encodeTo(${required}) are mismatched`);
        }
        return buf;
    }

    /**
     * Encodes the given box into the given buffer.
     * @param obj The box to encode.
     * @param buffer The buffer to write to.
     * @return The number of bytes of available space required in the buffer.
     * If <code>0</code>, then the box was successfully written to the buffer.
     */
    public encodeTo(obj: Box, buffer: Buffer): number {
        this.encodedBytes = 0;
        // TODO implement box header encoding
        throw new Error("not implemented yet");
    }

    /**
     * Decodes the given buffer into a box object, using the optional pre-parsed box header if provided.
     * @param buffer The buffer to read from (starting at offset 0).
     * @param header A optional pre-parsed box header.
     * @return A parsed box object,
     * or if there isn't enough data in the buffer, returns the total
     * number of bytes needed to decode the box (excluding children, and the header if provided).
     */
    public decode(buffer: Buffer, header?: BoxHeader): Box | number {
        if (header != null) {
            this.decodedBytes = 0;
            return header;
        }
        const parsedHeader = BoxHeader.parse(buffer);
        if (typeof parsedHeader === "number") {
            return parsedHeader;
        }
        this.decodedBytes = BoxHeader.decodedBytes;
        return parsedHeader;
    }

}

/**
 * A partial encoding for full boxes.
 */
export class FullBoxEncoding extends BoxEncoding {

    public override encodingLength(obj: FullBox): number {
        return super.encodingLength(obj) + FullBoxHeader.encodingLength(obj);
    }

    public override encodeTo(obj: Box, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        //let offset: number = this.encodedBytes;
        // TODO implement full box encoding
        //this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): FullBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        const fullBoxHeader = FullBoxHeader.parse(buffer.slice(this.decodedBytes));
        if (typeof fullBoxHeader === "number") {
            return this.decodedBytes + fullBoxHeader;
        }
        this.decodedBytes += FullBoxHeader.decodedBytes;
        return {
            ...superBox,
            ...fullBoxHeader,
        };
    }

}
