import { Encoder } from "./Encoder.js";
import { NILVALUE, FACILITY_STR, SEVERITY_STR } from "./Rfc5424Rule.js";


const MS_CACHE_SIZE = 1000;
let tmp = new Array(MS_CACHE_SIZE);
for (let ms = 0; ms < MS_CACHE_SIZE; ms++) {
  tmp[ms] = "." + ms.toString().padStart(3, "0") + "Z";
}
const MS_CACHE = Object.freeze(tmp);

const PRI_CACHE_SIZE = FACILITY_STR.length * SEVERITY_STR.length;
tmp = new Array(PRI_CACHE_SIZE);
for (let pri = 0; pri <= PRI_CACHE_SIZE; pri++) {
  tmp[pri] = "<" + pri.toString() + ">";
}
const PRI_CACHE = Object.freeze(tmp);
const SP = " ";


/**
 * @implements {Encoder}
 */
export class SyslogEncoder {

  static {
  }

  #structuredDataEncoder = new StructuredDataEncoder();
  #timestampCache = "";
  #timestampCacheSec = 0;
  /**
   * @param {import("./SyslogStmt.js").SyslogStmt} syslogStmt
   * @returns {string}
   */
  encode(syslogStmt) {
    const header = this.#header(syslogStmt);
    const structuredData = this.#structuredDataEncoder.encode(syslogStmt.structuredData);
    const rawMsg = syslogStmt.msg ? syslogStmt.msg : "";
    let msg = "";
    if (rawMsg !== "") {
      msg = " ".concat("\uFEFF", Encoder.escapeControlChars(rawMsg));
    }

    return `${header} ${structuredData}${msg}`;
  }

  /**
   * ヘッダーを生成する。
   * @param {import("./SyslogStmt.js").SyslogStmt} syslogStmt
   * @returns {string}
   */
  #header(syslogStmt) {
    /**
     * 返却値を読みやすくするために一旦変数で受けてる
     */
    const pri = PRI_CACHE[syslogStmt.pri];
    const ver = syslogStmt.version;
    const host = syslogStmt.hostname;
    const app = syslogStmt.appname;
    const proc = syslogStmt.procId;
    const msgId = syslogStmt.messageId;

    const timeSec = Math.floor(syslogStmt.timestamp / 1000);
    if (this.#timestampCacheSec !== timeSec) {
      this.#timestampCacheSec = timeSec;
      this.#timestampCache = new Date(syslogStmt.timestamp).toISOString().slice(0, 19);
    }

    const timestamp = this.#timestampCache + MS_CACHE[syslogStmt.timestamp - (timeSec * 1000)];

    // 速くするために読みやすさを捨てる
    //return `${pri} ${ver} ${timestamp} ${host} ${app} ${proc} ${msgId}`;
    return pri + SP + ver + SP + timestamp + SP + host + SP + app + SP + proc + SP + msgId;
  }
}

/**
 */
export class StructuredDataEncoder {
  constructor() {

  }

  /**
   * structureDataをキャッシュして保持します。structureDataの後からの変更は止めてください。
   * @param {*} structuredData 
   * @returns 
   */
  encode(structuredData) {
    const elements = structuredData.element;

    if (elements.size === 0) {
      return NILVALUE;
    }

    let res = [];

    for (const [sdId, params] of elements) {
      const paramStrings = [];
      for (const [key, value] of params) {
        paramStrings.push(` ${key}="${value}"`);
      }
      const sdParamas = paramStrings.join("");

      res.push(`[${sdId}${sdParamas}]`);
    }

    return res.join("");
  }
}