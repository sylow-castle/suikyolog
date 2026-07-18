import { Encoder } from "./Encoder.js";
import { SyslogStmt } from "./SyslogStmt.js";
import { Transporter } from "./Transporter.js";
import { Writer } from "./Writer.js";

/**
 * コンソール出力をするトランスポーター
 */
export class ConsoleWriter extends Writer {
  #errorHandler = null;

  constructor(conf = {}) {
    super(conf);
    if(typeof conf.onError === "function") {
      this.#errorHandler = conf.onError
    }
  }

  /**
   * コンソールに出力する
   * @override
   * @param {string} payload
   * @throw Error コンソール出力でエラーが発生した場合
   */
  write(frame) {
    try {
      console.log(frame);
    } catch (err) {
      this.#errorHandler(err);
    }
  }
}