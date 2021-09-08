import {Buffer} from "buffer";
import type {Box, BoxHeader} from "@isomp4/core";
import {BoxEncoding} from "@isomp4/core";
import type {VisualSampleEntry} from "./SampleEntry.js";
import {VisualSampleEntryEncoding} from "./SampleEntry.js";

export interface AVCConfigurationBox extends Box {
    configurationVersion: number;
    profileIndication: number;
    profileCompatibility: number;
    levelIndication: number;
    lengthSizeMinusOne: number;
    sequenceParameterSets: Buffer[];
    pictureParameterSets: Buffer[];
    // Extended fields (for high profiles)
    ext?: Ext | Buffer;
}

interface Ext {
    chromaFormat: number;
    bitDepthLumaMinus8: number;
    bitDepthChromaMinus8: number;
    sequenceParameterSetsExt: Buffer[];
}

function toHexByte(value: number): string {
    return value.toString(16).padStart(2, "0");
}

export function getAVCCodec(avcC: AVCConfigurationBox): string {
    return toHexByte(avcC.profileIndication) +
        toHexByte(avcC.profileCompatibility) +
        toHexByte(avcC.levelIndication);
}

function readParameterSets(buffer: Buffer, offset: number, countMask: number): Buffer[] | number {
    if (buffer.length < offset + 1) {
        return offset + 1;
    }
    const parameterSets: Buffer[] = [];
    const numOfParameterSets: number = buffer.readUInt8(offset++) & countMask;
    for (let i = 0; i < numOfParameterSets; i++) {
        if (buffer.length < offset + 2) {
            return offset + 2;
        }
        const parameterSetLength: number = buffer.readUInt16BE(offset);
        offset += 2;
        if (buffer.length < offset + parameterSetLength) {
            return offset + parameterSetLength;
        }
        parameterSets.push(Buffer.from(buffer.slice(offset, offset += parameterSetLength)));
    }
    readParameterSets.offset = offset;
    return parameterSets;
}

namespace readParameterSets {
    export let offset: number;
}

class AVCCEncoding extends BoxEncoding {

    constructor() {
        super("avcC");
    }

    public override encodingLength(obj: AVCConfigurationBox): number {
        return super.encodingLength(obj); // TODO implement
    }

    public override encodeTo(obj: AVCConfigurationBox, buffer: Buffer): number {
        const requiredBytes = super.encodeTo(obj, buffer);
        if (requiredBytes > 0) {
            return requiredBytes;
        }
        // let offset = this.encodedBytes;
        // // TODO implementing encoding
        // this.encodedBytes = offset;
        return 0;
    }

    public override decode(buffer: Buffer, header?: BoxHeader): AVCConfigurationBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        let offset: number = this.decodedBytes;
        if (buffer.length < offset + 5) {
            return offset + 5;
        }
        const configurationVersion: number = buffer.readUInt8(offset++);
        const profileIndication: number = buffer.readUInt8(offset++);
        const profileCompatibility: number = buffer.readUInt8(offset++);
        const levelIndication: number = buffer.readUInt8(offset++);
        const lengthSizeMinusOne: number = buffer.readUInt8(offset++) & 0b11;
        const sequenceParameterSets = readParameterSets(buffer, offset, 0b11111);
        if (typeof sequenceParameterSets === "number") {
            return sequenceParameterSets;
        }
        offset = readParameterSets.offset;
        const pictureParameterSets = readParameterSets(buffer, offset, 0b11111111);
        if (typeof pictureParameterSets === "number") {
            return pictureParameterSets;
        }
        offset = readParameterSets.offset;
        // Handle extended fields
        let ext: Ext | Buffer | undefined;
        // Verify that more data is available to read in the box
        const end = BoxEncoding.end(superBox, header);
        if (offset < end) {
            switch (profileIndication) {
                case 100: // high
                case 110: // high 10
                case 122: // high 4:2:2
                case 144: // unknown
                {
                    if (buffer.length < offset + 3) {
                        return offset + 3;
                    }
                    const chromaFormat = buffer.readUInt8(offset++) & 0b11;
                    const bitDepthLumaMinus8 = buffer.readUInt8(offset++) & 0b111;
                    const bitDepthChromaMinus8 = buffer.readUInt8(offset++) & 0b111;
                    const sequenceParameterSetsExt = readParameterSets(buffer, offset, 0b11111111);
                    if (typeof sequenceParameterSetsExt === "number") {
                        return sequenceParameterSetsExt;
                    }
                    ext = {
                        chromaFormat,
                        bitDepthLumaMinus8,
                        bitDepthChromaMinus8,
                        sequenceParameterSetsExt,
                    };
                    offset = readParameterSets.offset;
                    break;
                }
                default:
                    ext = Buffer.from(buffer.slice(offset, end));
                    break;
            }
        }
        this.decodedBytes = offset;
        return {
            ...superBox,
            configurationVersion,
            profileIndication,
            profileCompatibility,
            levelIndication,
            lengthSizeMinusOne,
            sequenceParameterSets,
            pictureParameterSets,
            ext,
        };
    }

}

export const avcC = new AVCCEncoding();

export interface AVCBox extends VisualSampleEntry {
    config: AVCConfigurationBox;
}

class AVCEncoding extends VisualSampleEntryEncoding {

    public override decode(buffer: Buffer, header?: BoxHeader): AVCBox | number {
        const superBox = super.decode(buffer, header);
        if (typeof superBox === "number") {
            return superBox;
        }
        const config = avcC.decode(buffer.slice(this.decodedBytes));
        if (typeof config === "number") {
            return this.decodedBytes + config;
        }
        this.decodedBytes += avcC.decodedBytes;
        return {
            ...superBox,
            config,
        };
    }

}

export const avc1 = new AVCEncoding("avc1");
export const avc2 = new AVCEncoding("avc2");
export const avc3 = new AVCEncoding("avc3");
export const avc4 = new AVCEncoding("avc4");
