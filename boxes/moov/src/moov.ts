import {BoxContainerEncoding} from "@isomp4/core";

export const moov = new BoxContainerEncoding("moov");
export const trak = new BoxContainerEncoding("trak");
export const mdia = new BoxContainerEncoding("mdia");
export const minf = new BoxContainerEncoding("minf");
export const stbl = new BoxContainerEncoding("stbl");

export * from "./avc.js";
export * from "./mvhd.js";
export * from "./SampleEntry.js";
export * from "./stsd.js";
