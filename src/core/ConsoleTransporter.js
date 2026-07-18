import { Encoder } from "./Encoder.js";
import { SyslogStmt } from "./SyslogStmt.js";
import { Transporter } from "./Transporter.js";

/**
 * コンソール出力をするトランスポーター
 */
export class ConsoleTransporter extends Transporter {
  /**
   * @type Encoder
   */
  #encoder = null;
  #errorHandler = null;
  constructor(conf = {}) {
    super();
    if(typeof conf.onError === "function") {
      this.#errorHandler = conf.onError
    }
  }

  setEncoder(encoder) {
    this.#encoder = encoder;
  }


  /**
   * コンソールに出力する
   * @override
   * @async
   * @param {SyslogStmt} payload
   * @throw Error コンソール出力でエラーが発生した場合
   */
  transport(payload) {
    const str = this.#encoder.encode(payload);
    try {
      console.log(str);
    } catch(err) {
      this.#errorHandler(err);
    }
  }
}