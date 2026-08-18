import { SyncWriter } from "./Writer.js";

export class MemoryWriter extends SyncWriter {
  #logs = []

  constructor() {
    super();
  }

  /**
   *
   * @overrider
   */
  write(frame, callback) {
    this.writeSync(frame);
    callback(null);
  }

  /**
   * @override
   * @param {string | byte[]} frame
   */
  writeSync(frame) {
    this.#logs.push(frame);
  }

  /**
   * logの内容が詰まった配列を返却します。
   * @returns {string[]}
   */
  getLogs() {
    return this.#logs.slice();
  }

  /**
   * 配列に蓄えていたログを空っぽにします。
   * @override
   */
  reload() {
    this.#logs = [];
  }
}