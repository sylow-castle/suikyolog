/**
 * トランスポーターの基底クラス。
 * @abstract
 * @class
 */
export class Transporter {
  #next = null;
  #eventTarget = null;
  _isClosed = false;

  constructor() {
    if (new.target === Transporter) {
      throw Error(`This is abstract class: ${Transporter.name}`);
    }
  }

  /**
   * 継承したクラスでオーバーライドしてください。非同期処理が前提です。
   * このメソッドは常に例外を投げます。
   * @abstract
   * @param {SyslogStmt | stinrg | byte[]} payload 
   * @throws {Error} 転送処理に失敗した場合。
   */
  transport(_payload) {
    throw new Error('Not implemented');
  }

  /**
   * イベントターゲットを設定する。
   * @param {EventTarget} eventTarget 
   */
  setEventTarget(eventTarget) {
    if (!(eventTarget instanceof EventTarget)) {
      throw new Error(`invalid eventTarget: ${eventTarget}`);
    }
    this.#eventTarget = eventTarget;
  }

  _getEventTarget() {
    return this.#eventTarget;
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
    if (this.#next) {
      this.#next.transport(syslogStmt);
    } else {
      throw new Error("Pipline is broken")
    }
  }

  get isClosed() {
    return this._isClosed;
  }

  /**
   * このトランスポーターが管理しているリソースを解放する
   * 冪等性確保のため２回目以降は無視されます。
   */
  close() {
    if (this.isClosed) {
      return;
    }

    this._isClosed = true;
    if (this.#next) {
      this.#next.close();
    }
  }

  reload() {
    this.#next.reload();
  }

}