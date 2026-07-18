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
    if(new.target === Writer) {
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
  write(frame) { }

  /**
   * エンコーダーを設定します
   * @param {Encoder} encoder 
   */
  setEncoder(encoder) {
    this[_encoder] = encoder
  }
}