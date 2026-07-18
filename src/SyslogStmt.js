/**
 * @typedef { 'Emerg' | 'Alert' | 'Crit' | 'Err' | 'Warn' | 'Notice' | 'Info' | 'Debug' } Severity
 */

import { MutableStructuredData, StructuredData } from "./StructuredData.js";
import * as Rfc5424Rule from "./Rfc5424Rule.js";

export class SyslogStmt {
  #facility = Rfc5424Rule.FACILITY_NUM.local0;
  #severity = Rfc5424Rule.SEVERITY_NUM.Alert;
  #timestamp = Date.now();
  #version = Rfc5424Rule.VERSION;
  #hostname = Rfc5424Rule.NILVALUE;
  #appname = Rfc5424Rule.NILVALUE;
  #procId = Rfc5424Rule.NILVALUE;
  #msgId = Rfc5424Rule.NILVALUE;
  #structuredData = new MutableStructuredData();
  #msg = "";

  /**
   * PRI値を取得する。
   * @returns {number}
   */
  get pri() {
    return Rfc5424Rule.getPri(this.#facility, this.#severity);
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
    const result = this.gen(this.#msg);
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
    if (typeof facility === "string" && Rfc5424Rule.FACILITY_NUM.hasOwnProperty(facility)) {
      this.#facility = Rfc5424Rule.FACILITY_NUM[facility];
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
    if (typeof severity === "string" && Rfc5424Rule.SEVERITY_NUM.hasOwnProperty(severity)) {
      this.#severity = Rfc5424Rule.SEVERITY_NUM[severity];
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
   * バージョン番号を取得する
   * @returns {string}
   */
  get version() {
    return this.#version.toString();
  }

  /**
   * タイムスタンプを設定する。現在時刻はログ生成時に自動設定される。
   * 引数がDate型の場合はそのインスタンスを使用、そうでない場合はDateコンストラクタに渡す。
   * @param {*} timestamp 
   * @returns {SyslogStmt}
   */
  time(timestamp) {
    if (timestamp === null || timestamp === undefined) {
      this.#timestamp = Date.now();
    } else if (Number.isInteger(timestamp)) {
      this.#timestamp = timestamp;
    } else if (timestamp instanceof Date) {
      this.#timestamp = timestamp.getTime();
    } else {
      throw new Error(`Invalid timestamp: ${timestamp}`);
    }
    return this;
  }

  /**
   * タイムスタンプを取得する
   * @returns {Date}
   */
  get timestamp() {
    return this.#timestamp;
  }

  /**
   * ホスト名を設定する。
   * @param {string} hostname 空文字、null、undefined を与えられると、NILVALUEとして解釈します。 
   * @returns {SyslogStmt}
   */
  host(hostname) {
    hostname = this.#nilOrString(hostname);

    if (Rfc5424Rule.isValidHostname(hostname)) {
      this.#hostname = hostname;
    } else {
      throw new Error(`Invalid hostname: ${hostname}`);
    }

    return this;
  }

  /**
   * ホスト名を取得する。
   * @returns {string}
   */
  get hostname() {
    return this.#hostname;
  }

  /**
   * アプリケーション名を設定する。
   * @param {string} appname 空文字、null、undefined を与えられると、NILVALUEとして解釈します。
   * @returns {SyslogStmt}
   */
  app(appname) {
    appname = this.#nilOrString(appname);

    if (Rfc5424Rule.isValidAppName(appname)) {
      this.#appname = appname;
    } else {
      throw new Error(`Invalid appname: ${appname}`);
    }

    return this;
  }

  /**
   * アプリケーション名を取得する。
   * @returns {string}
   */
  get appname() {
    return this.#appname;
  }

  /**
   * プロセスIDを設定する。
   * @param {string} procId 空文字、null、undefined を与えられると、NILVALUEとして解釈します。
   * @returns {SyslogStmt}
   */
  proc(procId) {
    procId = this.#nilOrString(procId);
    if (Rfc5424Rule.isValidProcessId(procId)) {
      this.#procId = procId;
    } else {
      throw new Error(`Invalid procId: ${procId}`);
    }

    return this;
  }

  /**
   * プロセスIDを取得する。
   * @returns {string}
   */
  get procId() {
    return this.#procId;
  }

  /**
   * メッセージIDを設定する。
   * @param {string} msgId 空文字、null、undefined を与えられると、NILVALUEとして解釈します。
   * @returns {SyslogStmt}
   */
  msgId(msgId) {
    msgId = this.#nilOrString(msgId);

    if (Rfc5424Rule.isValidMsgId(msgId)) {
      this.#msgId = msgId;
    } else {
      throw new Error(`Invalid msgId: ${msgId}`);
    }

    return this;
  }

  /**
   * メッセージIDを取得する。
   * @returns {string}
   */
  get messageId() {
    return this.#msgId;
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
      if (structuredData !== Rfc5424Rule.NILVALUE) {
        throw new Error(`Invalid structuredData: ${structuredData}`);
      }
      this.#structuredData = structuredData;
    } else if (structuredData instanceof StructuredData) {
      this.#structuredData = structuredData;
    } else {
      throw new Error(`Invalid structuredData: ${structuredData}`);
    }

    return this;
  }

  /**
   * 構造化データを取得する。
   * @returns {string}
   */
  get structuredData() {
    return this.#structuredData;
  }

  /**
   * メッセージを取得する。
   * @returns {string}
   */
  get msg() {
    return this.#msg;
  }

  /**
   * ログレベルをemergに設定する。
   * @returns {SyslogStmt}
   */
  emerg() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Emerg);
  }

  /**
   * ログレベルをcritに設定する。
   * @returns {SyslogStmt}
   */
  crit() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Crit);

  }

  /**
   * ログレベルをalertに設定する。
   * @returns {SyslogStmt}
   */
  alert() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Alert);
  }

  /**
   * ログレベルをerrに設定する。
   * @returns {SyslogStmt}
   */
  err() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Err);
  }

  /**
   * ログレベルをwarnに設定する。
   * @returns {SyslogStmt}
   */
  warn() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Warn);
  }

  /**
   * ログレベルをnoticeに設定する。
   * @returns {SyslogStmt}
   */
  notice() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Notice);
  }

  /**
   * ログレベルをinfoに設定する。
   * @returns {SyslogStmt}
   */
  info() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Info);
  }

  /**
   * ログレベルをdebugに設定する。
   * @returns {SyslogStmt}
   */
  debug() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Debug);
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
   * undefined, null, 空文字を NILVALUE("-") に置換する
   * @param {*} src 
   * @returns 
   */
  #nilOrString(src) {
    let result = src ?? "";
    if (result === "") {
      result = Rfc5424Rule.NILVALUE;
    }
    return result;
  }
}
