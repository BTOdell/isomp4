import {BoxEncoding} from "@isomp4/core";
import {mfhd} from "./mfhd.js";
import {tfdt} from "./tfdt.js";
import {tfhd} from "./tfhd.js";
import {trun} from "./trun.js";

export const traf = new BoxEncoding("traf", tfdt, tfhd, trun);
export const moof = new BoxEncoding("moof", mfhd, traf);

export * from "./mfhd.js";
export * from "./tfdt.js";
export * from "./tfhd.js";
export * from "./trun.js";
