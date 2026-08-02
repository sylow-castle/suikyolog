import { Writer } from "./Writer.js";

export class MemoryWriter extends Writer {
  #size = 1000;
  #logs = [];

  constructor(config) {
    super(config);
    const size = config.size ? config.size : 1000;
    if (Number.isInteger(size) && size > 0) {
      this.#size = size;
      this.#logs = new Array(this.#size);
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