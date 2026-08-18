import { SyncWriter } from "./Writer.js";

/**
 * コンソール出力をするトランスポーター
 */
export class ConsoleWriter extends SyncWriter {

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
    } catch (err) {
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

}