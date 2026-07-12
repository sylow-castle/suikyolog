import { SyslogStmt } from "./SyslogStmt.js";

export class ConsoleLogger {
  #level = 1;
  #version = 1;
  #facility = 16;
  #hostname = SyslogStmt.NILVALUE;
  #appname = SyslogStmt.NILVALUE;
  #procId = SyslogStmt.NILVALUE;
  #msgId = SyslogStmt.NILVALUE;
  #validator = new SyslogStmt();

  constructor() {
    ['emerg', 'alert', 'crit', 'err', 'warn', 'notice', 'info', 'debug'].forEach(level => {
      this[level] = (syslogStmt) => {
        const upperCase = level.charAt(0).toUpperCase() + level.slice(1)
        const finalStmt = this.createSyslogStmt(syslogStmt).sev(upperCase);
        this.log(finalStmt);
        return this;
      };
    });
  }
  /**
   * このロガーの設定を元にSyslogStmtを設定、生成する
   * @param {SyslogStmt | undefined} syslogStmt ログの元となるSyslogStmt。指定がなければ新規に作成する
   * @returns {SyslogStmt} 設定済みのSyslogStmt
   */
  createSyslogStmt(syslogStmt) {
    if (typeof syslogStmt === 'undefined') {
      syslogStmt = new SyslogStmt();
    } else if (!(syslogStmt instanceof SyslogStmt)) {
      throw new Error("Invalid syslogStmt");
    }

    syslogStmt.app(this.#appname)
      .ver(this.#version)
      .fac(this.#facility)
      .host(this.#hostname)
      .proc(this.#procId)
      .msgId(this.#msgId);

    return syslogStmt;
  }

  /**
   * @param {number} level
   * @returns {ConsoleLogger}
   */
  level(level) {
    if (Number.isInteger(level) && 0 <= level && level <= 7) {
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
    this.#validator.ver(version);
    this.#version = version;
    return this;
  }

  /**
   * 
   * @param {*} facility 
   * @returns 
   */
  fac(facility) {
    this.#validator.fac(facility);
    this.#facility = facility;
    return this;
  }

  /**
   * ログのホスト名を設定する。
   * @param {string} hostname 
   * @returns {ConsoleLogger}
   */
  host(hostname) {
    this.#validator.host(hostname);
    this.#hostname = hostname;
    return this;
  }

  /**
   * ログのアプリケーション名を設定する。
   * @param {string} appname 
   * @returns {ConsoleLogger}
   */
  app(appname) {
    this.#validator.app(appname);
    this.#appname = appname;
    return this;
  }

  /**
   * ログのプロセスIDを設定する。
   * @param {string} procId 
   * @returns {ConsoleLogger}
   */
  proc(procId) {
    this.#validator.proc(procId);
    this.#procId = procId;
    return this;
  }

  /**
   * ログのメッセージIDを設定する。
   * @param {string} msgId 
   * @returns {ConsoleLogger}
   */
  msgId(msgId) {
    this.#validator.msgId(msgId);
    this.#msgId = msgId;
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
  log(syslogStmt, format = "simple") {
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