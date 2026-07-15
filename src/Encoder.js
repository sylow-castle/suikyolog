/**
 * @abstract
 * @interface
 */
export class Encoder {
  /**
   * @abstract
   * @param {import("./SyslogStmt.js").SyslogStmt} syslogStmt
   * @returns {string}
   */
  encode(syslogStmt) {
    throw new Error("not implemented");
  }

  /**
   * ログのメッセージ中の制御文字をエスケープする。
   * 対象：ANSI制御文字の0x00-0x1F (LF:0x0A, TAB:0x09 を除く) および 0x7F
   *      UTF8の\u200B-\u200F、\uFEFF\uFFFE\uFFFF
   * 例："h\x00\u200B\uFEFFtest" -> "h\\x00\\u200B\\uFEFFtest"
   * @param {string} str
   * @returns {string}
   */
  static escapeControlChars(str) {
    // 0x00-0x1F (TAB:0x09,LF:0x0A,CR:0x0D を除く) および 0x7F を対象にする
    // \x00-\x08: NUL～BS
    // \x0B-\x0C: VT, FF
    // \x0E-\x1F: SO～US
    // \x7F: DEL
    // \u200B-\u200F,\uFEFF, \uFFFE, \uFFFF：非文字
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\uFEFF\uFFFE\uFFFF]/g, (match) => {
      const char = match.charCodeAt(0);
      if (char <= 127) {
        const code = char.toString(16).toUpperCase().padStart(2, '0');
        return `\\x${code}`;
      } else {
        const code = char.toString(16).toUpperCase().padStart(4, '0');
        return `\\u${code}`;
      }
    });
  }


}
