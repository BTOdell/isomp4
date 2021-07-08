import {Buffer} from "buffer";
import type {Box, BoxHeader, FourCC} from "@isomp4/core";
import {BoxEncoding} from "@isomp4/core";
import type {VisualSampleEntry} from "./SampleEntry";
import {VisualSampleEntryEncoding} from "./SampleEntry";

export interface AVC1Box extends VisualSampleEntry {
}

class AVC1Encoding extends VisualSampleEntryEncoding {

    public override readonly type: FourCC = "avc1";

    public override decode(buffer: Buffer, header?: BoxHeader): AVC1Box | number {
        return super.decode(buffer, header);
    }

}

export const avc1 = new AVC1Encoding();

export interface AVCConfigurationBox extends Box {
    configurationVersion: number;
    profileIndication: number;
    profileCompatibility: number;
    levelIndication: number;
    lengthSizeMinusOne: number;
    sequenceParameterSets: Buffer[];
    pictureParameterSets: Buffer[];
    // High profile fields
    chromaFormat?: number;
    bitDepthLumaMinus8?: number;
    bitDepthChromaMinus8?: number;
    sequenceParameterSetsExt?: Buffer[];
}

function readParameterSets(buffer: Buffer, offset: number, countMask: number): Buffer[] | number {
    if (buffer.length <= offset) {
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

    public override readonly type: FourCC = "avcC";

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
        // Handle high profiles
        let chromaFormat: number | undefined;
        let bitDepthLumaMinus8: number | undefined;
        let bitDepthChromaMinus8: number | undefined;
        let sequenceParameterSetsExt: Buffer[] | undefined;
        if (profileIndication === 100 || // high
            profileIndication === 110 || // high 10
            profileIndication === 122 || // high 4:2:2
            profileIndication === 144) { // unknown
            if (buffer.length < offset + 3) {
                return offset + 3;
            }
            chromaFormat = buffer.readUInt8(offset++) & 0b11;
            bitDepthLumaMinus8 = buffer.readUInt8(offset++) & 0b111;
            bitDepthChromaMinus8 = buffer.readUInt8(offset++) & 0b111;
            const _sequenceParameterSetsExt = readParameterSets(buffer, offset, 0b11111111);
            if (typeof _sequenceParameterSetsExt === "number") {
                return _sequenceParameterSetsExt;
            }
            sequenceParameterSetsExt = _sequenceParameterSetsExt;
            offset = readParameterSets.offset;
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
            // High profile fields
            chromaFormat,
            bitDepthLumaMinus8,
            bitDepthChromaMinus8,
            sequenceParameterSetsExt,
        };
    }

}

export const avcC = new AVCCEncoding();
