import { SyslogStmt, SyslogStmtBuilder } from "./SyslogStmt.js";
import { NILVALUE, SEVERITY_NUM } from "./Rfc5424Rule.js";
import { Transporter } from "./Transporter.js";
import { MutableStructuredData } from "./StructuredData.js";
import * as EventType from "./EventType.js";

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

/**
 * @typedef LoggerMethod
 * @property {function(string | SyslogStmt | Error) : LoggerMethod} info

/**
 * Syslog仕様に準拠したコンソールロガー
 * 
 * @class Logger
 */
export class Logger {
  #template = new SyslogStmtBuilder();
  #transporter = null;
  #eventTarget = null;

  #errorHandler = doNothing;
  #isMute = false;
  #isEnded = false;

  constructor(config) {
    const transporter = config.transporter;
    const eventTarget = config.eventTarget;

    if (transporter instanceof Transporter && eventTarget instanceof EventTarget) {
      this.#transporter = transporter;
      this.#eventTarget = eventTarget;
    } else {
      if (!(transporter instanceof Transporter)) {
        throw new Error(`invalid transporter: ${transporter}`);
      } else {
        throw new Error(`invalid eventTarget: ${eventTarget}`);
      }
    }
  }

  /**
   * @param {string | SyslogStmt | Error} syslogStmt 
   * @returns {Logger}
   */
  emerg(syslogStmt) {
    return this.#dispatchLog(LOG_LEVELS[0], syslogStmt);
  }

  /**
   * @param {string | SyslogStmt | Error} syslogStmt 
   * @returns {Logger}
   */
  alert(syslogStmt) {
    return this.#dispatchLog(LOG_LEVELS[1], syslogStmt);
  }

  /**
   * @param {string | SyslogStmt | Error} syslogStmt 
   * @returns {Logger}
   */
  crit(syslogStmt) {
    return this.#dispatchLog(LOG_LEVELS[2], syslogStmt);
  }

  /**
   * @param {string | SyslogStmt | Error} syslogStmt 
   * @returns {Logger}
   */
  err(syslogStmt) {
    return this.#dispatchLog(LOG_LEVELS[3], syslogStmt);
  }

  /**
   * @param {string | SyslogStmt | Error} syslogStmt 
   * @returns {Logger}
   */
  warn(syslogStmt) {
    return this.#dispatchLog(LOG_LEVELS[4], syslogStmt);
  }

  /**
   * @param {string | SyslogStmt | Error} syslogStmt 
   * @returns {Logger}
   */
  notice(syslogStmt) {
    return this.#dispatchLog(LOG_LEVELS[5], syslogStmt);
  }

  /**
   * @param {string | SyslogStmt | Error} syslogStmt 
   * @returns {Logger}
   */
  info(syslogStmt) {
    return this.#dispatchLog(LOG_LEVELS[6], syslogStmt);
  }

  /**
   * @param {string | SyslogStmt | Error} syslogStmt 
   * @returns {Logger}
   */
  debug(syslogStmt) {
    return this.#dispatchLog(LOG_LEVELS[7], syslogStmt);
  }

  #dispatchLog(levelStr, syslogStmt) {
    const upper = levelStr.charAt(0).toUpperCase() + levelStr.slice(1)
    let finalStmt;
    const sevNum = SEVERITY_NUM[upper];

    if (typeof syslogStmt === "string") {
      finalStmt = this.#template.sev(sevNum).msg(syslogStmt).build();
    } else if (syslogStmt instanceof SyslogStmt) {
      finalStmt = this.#template.cloneTemplate()
        .sev(sevNum)
        .fac(syslogStmt.fac)
        .time(syslogStmt.timestamp)
        .host(syslogStmt.host)
        .app(syslogStmt.app)
        .proc(syslogStmt.proc)
        .msgId(syslogStmt.msgId)
        .sd(syslogStmt.sd)
        .msg(syslogStmt.msg).build()
    } else if (syslogStmt instanceof Error) {
      finalStmt = this.#template.sev(upper).msg(syslogStmt.message + "\n" + syslogStmt.stack).build();
    } else {
      finalStmt = this.#template.sev(upper).msg(syslogStmt.toString()).build();
    }

    this.log(finalStmt);
    return this;
  }

  /**
   * このロガーの設定を元にSyslogStmtを設定、生成する
   * @returns { SyslogStmt } 設定済みのSyslogStmt
   */
  createSyslogStmt(msg = "", sd, time) {
    const builder = this.#template.cloneTemplate();
    if (msg === null) {
      msg = "";
    }

    if (sd === NILVALUE || sd === null) {
      sd = new MutableStructuredData();
    }

    builder.msg(msg);
    builder.sd(sd)
    builder.time(time);
    return builder.build();
  }


  /**
   * このロガーが出力するログのバージョンを設定する
   * @param {*} version 
   * @returns 
   */
  ver(version) {
    this.#template.ver(version);
    return this;
  }

  /**
   * このロガーが出力するログのファシリティ（機能）を設定する
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
   * @returns {Logger}
   */
  host(hostname) {
    this.#template.host(hostname);
    return this;
  }

  /**
   * ログのアプリケーション名を設定する。
   * @param {string} appname 
   * @returns {Logger}
   */
  app(appname) {
    this.#template.app(appname);
    return this;
  }

  /**
   * ログのプロセスIDを設定する。
   * @param {string} procId 
   * @returns {Logger}
   */
  proc(procId) {
    this.#template.proc(procId);
    return this;
  }

  /**
   * ログのメッセージIDを設定する。
   * @param {string} msgId 
   * @returns {Logger}
   */
  msgId(msgId) {
    this.#template.msgId(msgId);
    return this;
  }

  /**
   * トランスポーターでの出力中にエラーが発生した場合に呼び出されるコールバックを設定する。
   * @param {(e: Error) => void} callback 
   * @returns {Logger}
   */
  onError(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Invalid callback');
    }
    this.#errorHandler = callback;
    return this;
  }

  /**
   * syslogStmtをこのロガーの設定でSyslogStmtを生成し、ログを出力する。
   * @param {SyslogStmt} syslogStmt 
   */
  log(syslogStmt) {
    if (this.#isMute || this.#isEnded) {
      return;
    }

    try {
      this.#transporter.transport(syslogStmt);
    } catch (err) {
      this.#errorHandler(err);
    }
  }

  /**
   * ログ出力を停止します。
   * @returns {Logger}
   */
  stop() {
    this.#isMute = true;
    return this;
  }

  /**
   * ログ出力を再開します。
   * @returns {Logger}
   */
  resume() {
    this.#isMute = false;
    return this;
  }

  close() {
    this.#eventTarget.addEventListener(EventType.CLOSED, () => {
      this.#isEnded = true;
    });
    this.#eventTarget.dispatchEvent(new CustomEvent(EventType.CLOSE));
  }

  addEventListener(type, listener) {
    this.#eventTarget.addEventListener(type, listener);
  }
}

function doNothing() {
}

