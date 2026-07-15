import { Encoder } from "./Encoder.js";
import { NILVALUE, escapeParamValue } from "./Rfc5424Rule.js";
/**
 * @implements {Encoder}
 */
export class SyslogEncoder {
  structuredDataEncoder = new StructureDataEncoder();
  /**
   * @param {import("./SyslogStmt.js").SyslogStmt} syslogStmt
   * @returns {string}
   */
  encode(syslogStmt) {
    const header = this.#header(syslogStmt);
    const structuredData = this.structuredDataEncoder.encode(syslogStmt.structuredData);
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
    const pri = syslogStmt.pri;
    const ver = syslogStmt.version;
    const host = syslogStmt.hostname;
    const app = syslogStmt.appname;
    const proc = syslogStmt.procId;
    const msgId = syslogStmt.messageId;

    const timestamp = syslogStmt.timestamp instanceof Date
      ? syslogStmt.timestamp.toISOString()
      : NILVALUE;

    return `<${pri}> ${ver} ${timestamp} ${host} ${app} ${proc} ${msgId}`;
  }
}


export class StructureDataEncoder {
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