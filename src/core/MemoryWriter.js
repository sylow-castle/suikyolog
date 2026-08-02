import { Writer } from "./Writer.js";

export class MemoryWriter extends Writer {
  #logs = []

  constructor() {
    super();
  }

  /**
   *
   * @overrider
   */
  write(frame) {
    this.#logs.push(frame);
  }

  /**
   * @override
   * @param {string | byte[]} frame
   */
  writeSync(frame) {
    this.write(frame);
  }

  /**
   * @override
   * @returns {boolean}
   */
  get canSync() {
    return true;
  }

  /**
   * logの内容が詰まった配列を返却します。
   * @returns {string[]}
   */
  getLogs() {
    return this.#logs.slice();
  }
}