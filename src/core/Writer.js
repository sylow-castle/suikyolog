import { Encoder } from "./Encoder.js";
import { SyslogStmt } from "./SyslogStmt.js";
import { Transporter } from "./Transporter.js";

export const _encoder = Symbol("encoder");

export class Writer extends Transporter {
  #config = {};


  /**
   * 
   * @param {object} config 
   */
  constructor(config) {
    super();
    if (new.target === Writer) {
      throw Error(`This is abstract class: ${Writer.name}`);
    }

    this[_encoder] = null;
    this.#config = config;
  }

  /**
   * エンコードしたデータを書きだす
   * @override
   * @param {SyslogStmt} payload 
   */
  transport(payload) {
    this.write(this[_encoder].encode(payload));

  }

  /**
   * 出口に沿った書き出し処理を記述します
   * @abstract
   * @param {string | byte[]} frame 
   */
  write(frame) {
    throw new Error("not implemented")
  }

  /**
   * 同期での書き出し処理を記述します
   * @param {string | byte[]} frame 
   */
  writeSync(frame) {
    throw new Error("sync operation is unsupported")
  }

  /**
   * バッファリングしている場合の書き出し処理を記述します
   */
  flush() {
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
   */
  close() {

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
  #config = {};
  #eventTarget = null;

  /**
   * 
   * @param {object} config 
   */
  constructor(config) {
    super();
    this[_encoder] = null;
    this.#config = config;
  }

  /**
   * 何もしない
   * 
   * @param {string | byte[]} frame 
   */
  write(frame) {
  }

  /**
   * 何もしない
   * @param {string | byte[]} frame 
   */
  writeSync(frame) {
  }

  /**
   * 何もしない
   */
  flush() {
  }

  /**
   * 何もしない
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
   * 何もしない
   */
  close() { }
}