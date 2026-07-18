import { SyslogStmt } from "./SyslogStmt.js";

/**
 * トランスポーターの基底クラス。
 * @abstract
 * @class
 */
export class Transporter {
  #next = null;

  /**
   * 継承したクラスでオーバーライドしてください。非同期処理が前提です。
   * このメソッドは常に例外を投げます。
   * @param {SyslogStmt | stinrg | byte[]} payload 
   * @throws {Error} 転送処理に失敗した場合。
   */
  transport(payload) {
    throw new Error('Not implemented');
  }

  /**
   * 次のトランスポータを設定する
   * @param {Transporter} next 
   */
  setNext(next) {
    this.#next = next;
  }

  /**
   * 
   * @param {SyslogStmt} syslogStmt 
   */
  next(syslogStmt) {
    if(this.#next) {
      this.#next.transport(syslogStmt);
    } else {
      throw new Error("Pipline is broken")
    }
  }

}