import { SyslogStmt } from "./SyslogStmt.js";
import { Transporter } from "./Transporter.js";
import { Writer } from "./Writer.js";

export class MemoryWriter extends Writer {
  #size = 1000;
  #logs = [];

  constructor(config) {
    super(config);
    const size = config.size ? config.size : 1000;
    if (Number.isInteger(size) && size > 0) {
      this.#size = size;
    } else {
      throw new Error(`invalid size parameter: ${size}`);
    }
  }

  /**
   *
   * @overrider
   */
  write(frame) {
    this.#logs.push(frame);
  }

  /**
   * logの内容が詰まった配列を返却します。
   * @returns {string[]}
   */
  getLogs() {
    return this.#logs.slice();
  }
}