import { Writer } from "./Writer.js";

/**
 * コンソール出力をするトランスポーター
 */
export class ConsoleWriter extends Writer {

  constructor() {
    super();
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