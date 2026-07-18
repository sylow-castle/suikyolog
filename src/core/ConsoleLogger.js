import { SyslogStmt } from "./SyslogStmt.js";
import { SyslogEncoder } from "./SyslogEncoder.js"
import { ConsoleTransporter } from "./ConsoleTransporter.js";
import { FACILITY_NUM, SEVERITY_NUM } from "./Rfc5424Rule.js";
import { Encoder } from "./Encoder.js";
import { Transporter } from "./Transporter.js";
import { NullTransporter } from "./NullTransporter.js";


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
 * Syslog仕様に準拠したコンソールロガー
 * 
 * @class ConsoleLogger
 * 
 * @method {ConsoleLogger} emerg(messageOrStmt: string | SyslogStmt | Error) - 最重要のエラーを出力する
 * @method {ConsoleLogger} alert(messageOrStmt: string | SyslogStmt | Error) - 即時対応が必要な警告を出力する
 * @method {ConsoleLogger} crit(messageOrStmt: string | SyslogStmt | Error) - 致命的なシステムエラーを出力する
 * @method {ConsoleLogger} err(messageOrStmt: string | SyslogStmt | Error) - 通常のエラーを出力する
 * @method {ConsoleLogger} warn(messageOrStmt: string | SyslogStmt | Error) - 警告を出力する
 * @method {ConsoleLogger} notice(messageOrStmt: string | SyslogStmt | Error) - 注意が必要な正常なイベントを出力する
 * @method {ConsoleLogger} info(messageOrStmt: string | SyslogStmt | Error) - 一般的な情報メッセージを出力する
 * @method {ConsoleLogger} debug(messageOrStmt: string | SyslogStmt | Error) - 開発用のデバッグ情報を出力する
 */
export class ConsoleLogger {
  #template = new SyslogStmt();
  #transporter = null;

  #errorHandler = doNothing;
  #isMute = false;

  static {
    for (const level of LOG_LEVELS) {
      ConsoleLogger.prototype[level] = function (syslogStmt) {
        return this.#dispatchLog(level, syslogStmt)
      };
    }
  }

  constructor(transporter) {
    if(!(transporter instanceof Transporter)) {
      throw new Error(`invalid transporter: ${transporter}`);
    }
    this.#transporter = transporter;


  }

  #dispatchLog(levelStr, syslogStmt) {
    const upper = levelStr.charAt(0).toUpperCase() + levelStr.slice(1)
    let finalStmt;

    if (typeof syslogStmt === "string") {
      finalStmt = this.#template.gen(syslogStmt).sev(upper);
    } else if (syslogStmt instanceof SyslogStmt) {
      finalStmt = syslogStmt.clone().sev(upper);
    } else if (syslogStmt instanceof Error) {
      finalStmt = this.#template.gen(syslogStmt.message + "\n" + syslogStmt.stack).sev(upper);
    } else {
      finalStmt = this.#template.gen(String(syslogStmt)).sev(upper);
    }

    this.log(finalStmt);
    return this;
  }

  /**
   * このロガーの設定を元にSyslogStmtを設定、生成する
   * @returns { SyslogStmt } 設定済みのSyslogStmt
   */
  createSyslogStmt() {
    return this.#template.clone();
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
   * トランスポーターでの出力中にエラーが発生した場合に呼び出されるコールバックを設定する。
   * @param {(e: Error) => void} callback 
   * @returns {ConsoleLogger}
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
  async log(syslogStmt) {    
    if(this.#isMute) {
      return;
    }
    try {
      const promise = this.#transporter.transport(syslogStmt);
      promise.catch((err) => {
        this.#errorHandler(err);
      });
    } catch(err) {
      this.#errorHandler(err);
    }
  }

  /**
   * ログ出力を停止します。
   * @returns {ConsoleLogger}
   */
  stop() {
    this.#isMute = true;
    return this;
  }

  /**
   * ログ出力を再開します。
   * @returns {ConsoleLogger}
   */
  resume() {
    this.#isMute = false;
    return this;
  }
}

function doNothing() {
}

