import {BoxEncoding} from "@isomp4/core";
import {hdlr} from "./hdlr.js";
import {mvhd} from "./mvhd.js";
import {stsd} from "./stsd.js";

export const stbl = new BoxEncoding("stbl", stsd);
export const minf = new BoxEncoding("minf", stbl);
export const mdia = new BoxEncoding("mdia", hdlr, minf);
export const trak = new BoxEncoding("trak", mdia);
export const moov = new BoxEncoding("moov", mvhd, trak);

export * from "./hdlr.js";
export * from "./mvhd.js";
export * from "./samples/avc.js";
export * from "./stsd.js";
