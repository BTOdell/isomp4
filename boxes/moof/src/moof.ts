import {BoxEncoding} from "@isomp4/core";
import {mfhd} from "./mfhd.js";
import {tfhd} from "./tfhd.js";

export const traf = new BoxEncoding("traf", tfhd);
export const moof = new BoxEncoding("moof", mfhd, traf);

export * from "./mfhd.js";
export * from "./tfhd.js";
