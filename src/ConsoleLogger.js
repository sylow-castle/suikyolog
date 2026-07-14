import { SyslogStmt } from "./SyslogStmt.js";
import { FACILITY_NUM, SEVERITY_NUM } from "./Rfc5424Rule.js";

const LOG_LEVELS = Object.freeze([
  "emerg",
  "alert",
  "crit",
  "err",
  "warn",
  "notice",
  "info",
  "debug",
]);

const FORMAT = Object.freeze({
  simple: "simple",
  rfc5424: "rfc5424",
});

export class ConsoleLogger {
  #level = 1;
  #template = new SyslogStmt();

  constructor() {
    for (const level of LOG_LEVELS) {
      this[level] = (syslogStmt) => {
        const upper = level.charAt(0).toUpperCase() + level.slice(1)
        const finalStmt = syslogStmt.clone().sev(upper);
        this.log(finalStmt, FORMAT.rfc5424);
        return this;
      };
    }
  }
  /**
   * このロガーの設定を元にSyslogStmtを設定、生成する
   * @returns { SyslogStmt } 設定済みのSyslogStmt
   */
  createSyslogStmt() {
    return this.#template.clone();
  }

  /**
   * @param {number} level
   * @returns {ConsoleLogger}
   */
  level(level) {
    if (Number.isInteger(level) && SEVERITY_NUM.Emerg <= level && level <= SEVERITY_NUM.Debug) {
      this.#level = level;
    } else {
      throw new Error(`Invalid level: ${level}`);
    }
    return this;
  }

  /**
   * 
   * @param {*} version 
   * @returns 
   */
  ver(version) {
    this.#template.ver(version);
    return this;
  }

  /**
   * 
   * @param {*} facility 
   * @returns 
   */
  fac(facility) {
    this.#template.fac(facility);
    return this;
  }

  /**
   * ログのホスト名を設定する。
   * @param {string} hostname 
   * @returns {ConsoleLogger}
   */
  host(hostname) {
    this.#template.host(hostname);
    return this;
  }

  /**
   * ログのアプリケーション名を設定する。
   * @param {string} appname 
   * @returns {ConsoleLogger}
   */
  app(appname) {
    this.#template.app(appname);
    return this;
  }

  /**
   * ログのプロセスIDを設定する。
   * @param {string} procId 
   * @returns {ConsoleLogger}
   */
  proc(procId) {
    this.#template.proc(procId);
    return this;
  }

  /**
   * ログのメッセージIDを設定する。
   * @param {string} msgId 
   * @returns {ConsoleLogger}
   */
  msgId(msgId) {
    this.#template.msgId(msgId);
    return this;
  }

  /**
   * @typedef { 'simple' | 'rfc5424' } LogFormat 
   */

  /**
   * syslogStmtをこのロガーの設定でSyslogStmtを生成し、ログを出力する。
   * @param {SyslogStmt} syslogStmt 
   * @param {LogFormat | undefined} format 省略時はsimple" 
   */
  log(syslogStmt, format = FORMAT.simple) {
    if (syslogStmt.isOutput(this.#level)) {
      console.log(syslogStmt.toString(format));
    }
  }

  /**
   * 引数のログを複製し、Emergレベルに設定して出力する。
   * @param {SyslogStmt} syslogStmt 
   * @returns {ConsoleLogger}
   */
  emerg(syslogStmt) { }

  /**
   * 引数のログを複製し、Critレベルに設定して出力する。
   * @param {SyslogStmt} syslogStmt 
   * @returns {ConsoleLogger}
   */
  crit(syslogStmt) { }

  /**
   * 引数のログを複製し、Alertレベルに設定して出力する。
   * @param {SyslogStmt} syslogStmt 
   * @returns {ConsoleLogger}
   */
  alert(syslogStmt) { }

  /**
   * 引数のログを複製し、Errorレベルに設定して出力する。
   * @param {SyslogStmt} syslogStmt 
   * @returns {ConsoleLogger}
   */
  err(syslogStmt) { }


  /**
   * 引数のログを複製し、Warnレベルに設定して出力する。
   * @param {SyslogStmt} syslogStmt 
   * @returns {ConsoleLogger}
   */
  warn(syslogStmt) { }

  /**
   * 引数のログを複製し、Noticeレベルに設定して出力する。
   * @param {SyslogStmt} syslogStmt 
   * @returns {ConsoleLogger}
   */
  notice(syslogStmt) { }

  /**
   * 引数のログを複製し、Infoレベルに設定して出力する。
   * @param {SyslogStmt} syslogStmt 
   * @returns {ConsoleLogger}
   */
  info(syslogStmt) { }

  /**
   * 引数のログを複製し、Debugレベルに設定して出力する。
   * @param {SyslogStmt} syslogStmt 
   * @returns {ConsoleLogger}
   */
  debug(syslogStmt) { }


}