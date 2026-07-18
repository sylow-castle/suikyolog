import { SyslogStmt } from "./SyslogStmt.js";
import { Transporter } from "./Transporter.js";

export class MemoryWriter extends Writer {

  #logs = [];


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