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
    if (typeof conf.onError === "function") {
      this.#errorHandler = conf.onError
    }
  }

  /**
   * コンソールに出力する
   * @override
   * @param {string} frame
   */
  write(frame) {
    console.log(frame);
  }

  /**
   * コンソールに出力する
   * @override
   * @param {string} frame 
   */
  writeSync(frame) {
    this.write(frame);
  }

  /**
   * @override
   */
  get canSync() {
    return true;
  }
}