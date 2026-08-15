import { Transporter } from "./Transporter.js";

export const _encoder = Symbol("encoder");

export class Writer extends Transporter {


  /**
   * 
   */
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
    if(!err) {
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
   * 同期での書き出し処理を記述します
   * @param {string | byte[]} _frame 
   */
  writeSync(_frame) {
    throw new Error("sync operation is unsupported")
  }

  /**
   * バッファリングしている場合の書き出し処理を記述します
   * @param {(err: Error | null) => void} callback
   */
  flush(callback) {
    callback(null);
  }

  /**
   * バッファリングしている場合の同期での書き出し処理を記述します
   */
  flushSync() {
  }

  /**
   * 同期書き込みをサポートするかを返却する
   * @returns {boolean}
   */
  get canSync() {
    return false;
  }

  /**
   * リソース開放処理を記述します。
   * 冪等性を確保するよう実装してください。
   */
  close() {

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

export class NullWriter extends Writer {

  constructor() {
    super();
    this[_encoder] = null;
  }

  /**
   * コールバック呼ぶだけ。
   * 
   * @param {string | byte[]} _frame 
   * @param {(err : Error | null) => void} callback
   */
  write(_frame, callback) {
    callback(null);
  }

  /**
   * 何もしない
   * @param {string | byte[]} _frame 
   */
  writeSync(_frame) {
  }


  /**
   * 同期書き込みをサポートするかを返却する
   * @returns {boolean}
   */
  get canSync() {
    return true;
  }

  /**
   * 何もしない
   */
  close() { }
}