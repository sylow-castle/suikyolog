import { Transporter } from "./Transporter.js";
import * as EventType from "./EventType.js";

export const _encoder = Symbol("encoder");

export class Writer extends Transporter {


  constructor() {
    super();
    if (new.target === Writer) {
      throw Error(`This is abstract class: ${Writer.name}`);
    }

    this[_encoder] = null;
  }

  /**
   * エンコードしたデータを書きだす
   * @override
   * @param {SyslogStmt} payload 
   */
  transport(payload) {
    this.write(this[_encoder].encode(payload), this.dispatchError);
  }

  /**
   * 渡されたErrorオブジェクトでerrorイベントを発行します。
   * nullを渡されたときは何もしません。
   * @param {Error | null} err 初期値はnullです
   */
  dispatchError(err = null) {
    if (!err) {
      return;
    }

    this._getEventTarget.dispatchEvent(new CustomEvent(EventType.Error, {
      detail: {
        src: this,
        err
      }
    }));
  }

  /**
   * 出口に沿った書き出し処理を記述します
   * @abstract
   * @param {string | byte[]} _frame 
   * @param {(err: Error | null) => void} _callback
   */
  write(_frame, _callback) {
    throw new Error("not implemented")
  }

  /**
   * リソース開放処理を記述します。
   * 冪等性を確保するよう実装してください。
   * @override
   */
  close() {
    if (this.isClosed) {
      return
    }

    this._isClosed = true;
  }

  /**
   * リソースのリロード処理を記述します。
   * @override
   */
  reload() {
  }


  /**
   * エンコーダーを設定します
   * @param {Encoder} encoder 
   */
  setEncoder(encoder) {
    this[_encoder] = encoder
  }

  /**
   * イベントリスナーを登録する
   * @param {string|symbol} type 
   * @param {Function} listener 
   */
  addEventListener(type, listener) {
    this._getEventTarget().addEventListener(type, listener);
  }

  /**
   * イベントリスナーを削除する
   * @param {string|symbol} type 
   * @param {Function} listener 
   */
  removeEventListener(type, listener) {
    this._getEventTarget().removeEventListener(type, listener);
  }

}

export class SyncWriter extends Writer {
  constructor() {
    super();
    if (new.target === SyncWriter) {
      throw Error(`This is abstract class: ${SyncWriter.name}`);
    }

  }

  /**
   * 同期での書き出し処理を記述します
   * @param {string | byte[]} _frame 
   */
  writeSync(_frame) {
    throw new Error("not implemented")
  }
}

export class NullWriter extends SyncWriter {

  constructor() {
    super();
    this[_encoder] = null;
  }

  /**
   * コールバック呼ぶだけ。
   * 
   * @override
   * @param {string | byte[]} _frame 
   * @param {(err : Error | null) => void} callback
   */
  write(_frame, callback) {
    callback(null);
  }

  /**
   * 何もしない
   * @override
   * @param {string | byte[]} _frame 
   */
  writeSync(_frame) {
  }

}