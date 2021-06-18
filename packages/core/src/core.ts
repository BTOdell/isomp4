import type {Encoding} from "@isomp4/encoding";
import type {Box} from "./Box";

export type BoxEncoding = Encoding<Box>;

const boxes: Map<string, BoxEncoding> = new Map();

export function registerBox(boxType: string, encoding: BoxEncoding): void {
    if (boxes.has(boxType)) {
        throw new Error("Box type is already registered: " + boxType);
    }
    boxes.set(boxType, encoding);
}

export function isBoxRegistered(boxType: string): boolean {
    return boxes.has(boxType);
}

export {Box} from "./Box";
