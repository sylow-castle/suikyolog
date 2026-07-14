/**
 * @typedef { 'Emerg' | 'Alert' | 'Crit' | 'Err' | 'Warn' | 'Notice' | 'Info' | 'Debug' } Severity
 */

import { StructuredData } from "./StructuredData.js";
import * as Rule from "./Rfc5424Rule.js";

export class SyslogStmt {
  #facility = 16;
  #severity = 1;
  #timestamp = new Date();
  #version = Rule.VERSION;
  #hostname = Rule.NILVALUE;
  #appname = Rule.NILVALUE;
  #procId = Rule.NILVALUE;
  #msgId = Rule.NILVALUE;
  #structuredData = new StructuredData();
  #msg = "";

  /**
   * PRI値を取得する。
   * @returns {number}
   */
  get pri() {
    return Rule.getPri(this.#facility, this.#severity);
  }

  /** 
   * タイムスタンプと構造化データを覗いて複製する。
   * 引数で新しいメッセージを設定する。
   * 申し訳ないがMSGにバイナリがRFC5424的には許されるが、ここでは対応してない（勘弁して欲しい）
   * @param {string} msg 
   * @returns {SyslogStmt}
   **/
  gen(msg) {
    const result = new SyslogStmt();
    result.#severity = this.#severity;
    result.#facility = this.#facility;
    result.#version = this.#version;
    result.#hostname = this.#hostname;
    result.#appname = this.#appname;
    result.#procId = this.#procId;
    result.#msgId = this.#msgId;
    //structuredDataとmsgはコピーしない。

    result.#msg = msg;
    return result;
  }

  /**
   * 現在のインスタンスのコピーを作成する。
   * @returns {SyslogStmt}
   */
  clone() {
    const result = this.gen();
    result.#structuredData = this.#structuredData;
    result.#timestamp = this.#timestamp;
    return result;
  }

  /**
   * ファシリティを設定する。
   * @param {string | number} facility 
   * @returns {SyslogStmt}
   */
  fac(facility) {
    if (typeof facility === "string" && Rule.FACILITY_NUM.hasOwnProperty(facility)) {
      this.#facility = Rule.FACILITY_NUM[facility];
    } else if (Number.isInteger(facility) && 0 <= facility && facility <= 23) {
      this.#facility = facility;
    } else {
      throw new Error(`Invalid facility: ${facility}`);
    }
    return this;
  }

  /**
   * 重大度を設定する。
   * @param {string | number} severity 
   * @returns {SyslogStmt}
   */
  sev(severity) {
    if (typeof severity === "string" && Rule.SEVERITY_NUM.hasOwnProperty(severity)) {
      this.#severity = Rule.SEVERITY_NUM[severity];
    } else if (Number.isInteger(severity) && 0 <= severity && severity <= 7) {
      this.#severity = severity;
    } else {
      throw new Error(`Invalid severity: ${severity}`);
    }
    return this;
  }

  /**
   * バージョンを設定する。とりあえず0か1しか設定しない。
   * @param {number} version 
   * @returns {SyslogStmt}
   */
  ver(version) {
    if (Number.isInteger(version) && 0 <= version && version <= 1) {
      this.#version = version;
    } else {
      throw new Error(`Invalid version: ${version}`);
    }
    return this;
  }

  /**
   * タイムスタンプを設定する。現在時刻はログ生成時に自動設定される。
   * 引数がDate型の場合はそのインスタンスを使用、そうでない場合はDateコンストラクタに渡す。
   * @param {*} timestamp 
   * @returns {SyslogStmt}
   */
  time(timestamp) {
    if (timestamp instanceof Date) {
      this.#timestamp = timestamp;
    } else {
      this.#timestamp = new Date(timestamp);
      if (isNaN(this.#timestamp)) {
        throw new Error(`Invalid timestamp: ${timestamp}`);
      }
    }
    return this;
  }

  /**
   * ホスト名を設定する。
   * @param {string} hostname 空文字、null、undefined を与えられると、NILVALUEとして解釈します。 
   * @returns {SyslogStmt}
   */
  host(hostname) {
    hostname = this.#nilOrString(hostname);

    if (Rule.isValidHostname(hostname)) {
      this.#hostname = hostname;
    } else {
      throw new Error(`Invalid hostname: ${hostname}`);
    }

    return this;
  }

  /**
   * アプリケーション名を設定する。
   * @param {string} appname 空文字、null、undefined を与えられると、NILVALUEとして解釈します。
   * @returns {SyslogStmt}
   */
  app(appname) {
    appname = this.#nilOrString(appname);

    if (Rule.isValidAppName(appname)) {
      this.#appname = appname;
    } else {
      throw new Error(`Invalid appname: ${appname}`);
    }

    return this;
  }

  /**
   * プロセスIDを設定する。
   * @param {string} procId 空文字、null、undefined を与えられると、NILVALUEとして解釈します。
   * @returns {SyslogStmt}
   */
  proc(procId) {
    procId = this.#nilOrString(procId);
    if (Rule.isValidProcessId(procId)) {
      this.#procId = procId;
    } else {
      throw new Error(`Invalid procId: ${procId}`);
    }

    return this;
  }

  /**
   * メッセージIDを設定する。
   * @param {string} msgId 空文字、null、undefined を与えられると、NILVALUEとして解釈します。
   * @returns {SyslogStmt}
   */
  msgId(msgId) {
    msgId = this.#nilOrString(msgId);

    if (Rule.isValidMsgId(msgId)) {
      this.#msgId = msgId;
    } else {
      throw new Error(`Invalid msgId: ${msgId}`);
    }

    return this;
  }

  /**
   * 引数で指定した構造化データを設定する。
   * 文字列が渡された場合は、そのまま設定する。
   * StructuredDataが渡された場合は、toString()を実行してから設定する。
   * @param {string | StructuredData} structuredData stringは"-"のみ許可。null、undefinedはNILVALUEとして扱う。
   * @returns {SyslogStmt}
   */
  sd(structuredData) {
    structuredData = this.#nilOrString(structuredData);
    if (typeof structuredData === 'string') {
      if (structuredData !== Rule.NILVALUE) {
        throw new Error(`Invalid structuredData: ${structuredData}`);
      }
      this.#structuredData = structuredData;
    } else if (structuredData instanceof StructuredData) {
      this.#structuredData = structuredData.toString();
    } else {
      throw new Error(`Invalid structuredData: ${structuredData}`);
    }

    return this;
  }

  /**
   * RFC5424形式でログを出力する。
   * @returns {string}
   */
  toRFC5424() {
    const msg = this.#msg ? " ".concat("\uFEFF", this.#msg) : "";
    return `${this.#header()} ${this.#structuredData.toString()}${msg}`;
  }

  /**
   * [重大度] タイムスタンプ メッセージの形式でログを出力する
   * @returns {string}
   */
  toSimple() {
    const sevStr = Rule.SEVERITY_STR[this.#severity] ?? "Unknown";
    return `[${sevStr}] ${this.#timestamp.toISOString()} ${this.#msg}`;
  }

  /**
   * ログの出力形式を指定して出力する
   * @param { "rfc5424" | "simple" } format 
   * @returns {string}
   */
  toString(format) {
    if (format === "simple") {
      return this.toSimple();
    }
    return this.toRFC5424();
  }

  get str() { return this.toRFC5424() };

  /**
   * ログレベルをemergに設定する。
   * @returns {SyslogStmt}
   */
  emerg() {
    return this.sev(Rule.SEVERITY_NUM.Emerg);
  }

  /**
   * ログレベルをcritに設定する。
   * @returns {SyslogStmt}
   */
  crit() {
    return this.sev(Rule.SEVERITY_NUM.Crit);

  }

  /**
   * ログレベルをalertに設定する。
   * @returns {SyslogStmt}
   */
  alert() {
    return this.sev(Rule.SEVERITY_NUM.Alert);
  }

  /**
   * ログレベルをerrに設定する。
   * @returns {SyslogStmt}
   */
  err() {
    return this.sev(Rule.SEVERITY_NUM.Err);
  }

  /**
   * ログレベルをwarnに設定する。
   * @returns {SyslogStmt}
   */
  warn() {
    return this.sev(Rule.SEVERITY_NUM.Warn);
  }

  /**
   * ログレベルをnoticeに設定する。
   * @returns {SyslogStmt}
   */
  notice() {
    return this.sev(Rule.SEVERITY_NUM.Notice);
  }

  /**
   * ログレベルをinfoに設定する。
   * @returns {SyslogStmt}
   */
  info() {
    return this.sev(Rule.SEVERITY_NUM.Info);
  }

  /**
   * ログレベルをdebugに設定する。
   * @returns {SyslogStmt}
   */
  debug() {
    return this.sev(Rule.SEVERITY_NUM.Debug);
  }

  /**
   * 指定したログレベルが現在の重大度以上であるかを判定する。
   * @param {number} level 
   * @returns {boolean}
   */
  isOutput(level) {
    return this.#severity <= level;
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

  /**
   * ヘッダーを生成する。
   * @returns {string}
   */
  #header() {
    const timestamp = this.#timestamp instanceof Date
      ? this.#timestamp.toISOString()
      : Rule.NILVALUE;

    return `<${this.pri}> ${this.#version} ${timestamp} ${this.#hostname} ${this.#appname} ${this.#procId} ${this.#msgId}`;
  }

  /**
   * undefined, null, 空文字を NILVALUE("-") に置換する
   * @param {*} src 
   * @returns 
   */
  #nilOrString(src) {
    let result = src ?? "";
    if (result === "") {
      result = Rule.NILVALUE;
    }
    return result;
  }



}
