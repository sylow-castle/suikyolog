/**
 * @typedef { 'Emerg' | 'Alert' | 'Crit' | 'Err' | 'Warn' | 'Notice' | 'Info' | 'Debug' } Severity
 */

import { MutableStructuredData, StructuredData } from "./StructuredData.js";
import * as Rfc5424Rule from "./Rfc5424Rule.js";

export class SyslogStmtHeader {
  #facility;
  #severity;
  #timestamp;
  #version;
  #hostname;
  #appname;
  #procId;
  #msgId;

  constructor(fac, sev, ver, time, host, app, proc, msgId,) {
    if (typeof fac === "string" && Rfc5424Rule.FACILITY_NUM.hasOwnProperty(fac)) {
      this.#facility = Rfc5424Rule.FACILITY_NUM[fac];
    } else if (Number.isInteger(fac) && 0 <= fac && fac <= 23) {
      this.#facility = fac;
    } else {
      throw new Error(`Invalid facility: ${fac}`);
    }

    if (typeof sev === "string" && Rfc5424Rule.SEVERITY_NUM.hasOwnProperty(sev)) {
      this.#severity = Rfc5424Rule.SEVERITY_NUM[sev];
    } else if (Number.isInteger(sev) && 0 <= sev && sev <= 7) {
      this.#severity = sev;
    } else {
      throw new Error(`Invalid severity: ${sev}`);
    }

    if (Number.isInteger(ver) && 0 <= ver && ver <= 1) {
      this.#version = ver;
    } else {
      throw new Error(`Invalid version: ${ver}`);
    }

    if (time === null || time === undefined) {
      this.#timestamp = Date.now();
    } else if (Number.isInteger(time)) {
      this.#timestamp = time;
    } else if (time instanceof Date) {
      this.#timestamp = time.getTime();
    } else {
      throw new Error(`Invalid timestamp: ${time}`);
    }


    host = this.#nilOrString(host);
    if (Rfc5424Rule.isValidHostname(host)) {
      this.#hostname = host;
    } else {
      throw new Error(`Invalid hostname: ${host}`);
    }

    app = this.#nilOrString(app);
    if (Rfc5424Rule.isValidAppName(app)) {
      this.#appname = app;
    } else {
      throw new Error(`Invalid appname: ${app}`);
    }

    proc = this.#nilOrString(proc);
    if (Rfc5424Rule.isValidProcessId(proc)) {
      this.#procId = proc;
    } else {
      throw new Error(`Invalid procId: ${proc}`);
    }

    msgId = this.#nilOrString(msgId);
    if (Rfc5424Rule.isValidMsgId(msgId)) {
      this.#msgId = msgId;
    } else {
      throw new Error(`Invalid msgId: ${msgId}`);
    }
  }

  get facility() {
    return this.#facility;
  }

  get severity() {
    return this.#severity;
  }

  /**
   * PRI値を取得する。
   * @returns {number}
   */
  get pri() {
    return Rfc5424Rule.getPri(this.#facility, this.#severity);
  }

  get timestamp() {
    return this.#timestamp;
  }

  get version() {
    return this.#version;
  }

  get hostname() {
    return this.#hostname;
  }

  get appname() {
    return this.#appname;
  }

  get procId() {
    return this.#procId;
  }

  get msgId() {
    return this.#msgId;
  }

  /**
   * 指定したログレベルが現在の重大度以上であるかを判定する。
   * @param {number} level 
   * @returns {boolean}
   */
  isOutput(level) {
    return this.severity <= level;
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


export class SyslogStmtBuilder {
  #header = null;
  #facility = Rfc5424Rule.FACILITY_NUM.local0;
  #severity = Rfc5424Rule.SEVERITY_NUM.Alert;
  #timestamp = null;
  #version = Rfc5424Rule.VERSION;
  #hostname = Rfc5424Rule.NILVALUE;
  #appname = Rfc5424Rule.NILVALUE;
  #procId = Rfc5424Rule.NILVALUE;
  #msgId = Rfc5424Rule.NILVALUE;
  #structuredData = new MutableStructuredData();
  #msg = "";


  constructor() {
  }

  /**
   * 
   * @param {*} timestamp 
   * @returns {SyslogStmtBuilder}
   */
  time(timestamp) {
    this.#timestamp = timestamp;
    return this;
  }

  /**
   * 
   * @param {number} facility 
   * @returns {SyslogStmtBuilder}
   */
  fac(facility) {
    this.#facility = facility;
    return this;
  }

  /**
   * 
   * @param {number} severity 
   * @returns {SyslogStmtBuilder}
   */
  sev(severity) {
    this.#severity = severity;
    return this;
  }

  /**
   * ログレベルをemergに設定する。
   * @returns {SyslogStmtBuilder}
   */
  emerg() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Emerg);
  }

  /**
   * ログレベルをcritに設定する。
   * @returns {SyslogStmtBuilder}
   */
  crit() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Crit);

  }

  /**
   * ログレベルをalertに設定する。
   * @returns {SyslogStmtBuilder}
   */
  alert() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Alert);
  }

  /**
   * ログレベルをerrに設定する。
   * @returns {SyslogStmtBuilder}
   */
  err() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Err);
  }

  /**
   * ログレベルをwarnに設定する。
   * @returns {SyslogStmtBuilder}
   */
  warn() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Warn);
  }

  /**
   * ログレベルをnoticeに設定する。
   * @returns {SyslogStmtBuilder}
   */
  notice() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Notice);
  }

  /**
   * ログレベルをinfoに設定する。
   * @returns {SyslogStmtBuilder}
   */
  info() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Info);
  }

  /**
   * ログレベルをdebugに設定する。
   * @returns {SyslogStmtBuilder}
   */
  debug() {
    return this.sev(Rfc5424Rule.SEVERITY_NUM.Debug);
  }

  /**
   * 
   * @param {number} version 
   * @returns {SyslogStmtBuilder}
   */
  ver(version) {
    this.#version = version;
    return this;
  }

  /**
   * 
   * @param {string} hostname 
   * @returns {SyslogStmtBuilder}
   */
  host(hostname) {
    this.#hostname = hostname;
    return this;
  }

  /**
   * 
   * @param {string} appname 
   * @returns {SyslogStmtBuilder}
   */
  app(appname) {
    this.#appname = appname;
    return this;
  }

  /**
   * 
   * @param {string} procId 
   * @returns {SyslogStmtBuilder}
   */
  proc(procId) {
    this.#procId = procId;
    return this;
  }

  /**
   * 
   * @param {string} msgId 
   * @returns {SyslogStmtBuilder}
   */
  msgId(msgId) {
    this.#msgId = msgId;
    return this;
  }

  /**
   * 
   * @param {StructuredData} sd 
   * @returns {SyslogStmtBuilder}
   */
  sd(sd) {
    this.#structuredData = sd;
    return this;
  }

  /**
   * 
   * @param {string} msg 
   * @returns {SyslogStmtBuilder}
   */
  msg(msg) {
    this.#msg = msg;
    return this;
  }

  cloneTemplate() {
    const builder = new SyslogStmtBuilder()
    builder.#facility = this.#facility;
    builder.#severity = this.#severity;
    builder.#version = this.#version;
    builder.#timestamp = this.#timestamp;
    builder.#hostname = this.#hostname;
    builder.#appname = this.#appname;
    builder.#procId = this.#procId;
    builder.#msgId = this.#msgId;
    builder.#structuredData = this.#structuredData;
    builder.#msg = this.#msg;
    return builder;
  }

  /**
   * 
   * @returns {SyslogStmt}
   */
  build() {
    const fac = this.#facility;
    const sev = this.#severity;
    const ver = this.#version;
    const host = this.#hostname;
    const app = this.#appname;
    const proc = this.#procId;
    const msgId = this.#msgId;
    const time = this.#timestamp;
    const structuredData = this.#structuredData instanceof StructuredData ? this.#structuredData.freeze() : this.#structuredData;
    const msg = this.#msg;
    const header = new SyslogStmtHeader(fac, sev, ver, time, host, app, proc, msgId);
    return new SyslogStmt(header, structuredData, msg);
  }
}



export class SyslogStmt {
  #header = null;
  #structuredData = null;
  #msg = "";

  constructor(header, structuredData = Rfc5424Rule.NILVALUE, msg = "") {
    this.#header = header;
    structuredData = structuredData ?? Rfc5424Rule.NILVALUE;
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

    this.#msg = msg;

  }


  /**
   * PRI値を取得する。
   * @returns {number}
   */
  get pri() {
    return this.#header.pri;
  }

  /**
   * バージョン番号を取得する
   * @returns {string}
   */
  get version() {
    return this.#header.version;
  }

  /**
   * タイムスタンプを取得する
   * @returns {Date}
   */
  get timestamp() {
    return this.#header.timestamp;
  }

  /**
   * ホスト名を取得する。
   * @returns {string}
   */
  get hostname() {
    return this.#header.hostname;
  }

  /**
   * アプリケーション名を取得する。
   * @returns {string}
   */
  get appname() {
    return this.#header.appname;
  }


  /**
   * プロセスIDを取得する。
   * @returns {string}
   */
  get procId() {
    return this.#header.procId;
  }


  /**
   * メッセージIDを取得する。
   * @returns {string}
   */
  get messageId() {
    return this.#header.msgId;
  }

  /**
   * 構造化データを取得する。
   * @returns {StructuredData | string}
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
   * 指定したログレベルが現在の重大度以上であるかを判定する。
   * @param {number} level 
   * @returns {boolean}
   */
  isOutput(level) {
    return this.#header.isOutput(level);
  }

}
