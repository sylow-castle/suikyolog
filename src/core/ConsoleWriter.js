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
   * @param {(err:Error | null) => void} callback
   */
  write(frame, callback) {
    try {
      this.writeSync(frame);
      callback(null);
    } catch(err) {
      callback(err);
    }
  }

  /**
   * コンソールに出力する
   * @override
   * @param {string} frame 
   */
  writeSync(frame) {
    console.log(frame);
  }

  /**
   * @override
   */
  get canSync() {
    return true;
  }
}