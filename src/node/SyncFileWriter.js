import { Writer } from "../core/Writer.js";
import fs from "node:fs";

export class SyncFileWriter extends Writer {
  #fd = null;
  #path = null;

  /**
   * @param {object} options
   * @param {string} options.path
   */
  constructor(options = {}) {
    super();
    this.#path = options.path;
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND;
    //const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_DSYNC;
    this.#fd = fs.openSync(this.#path, flags);
  }


  /**
   * 非同期でファイルに書き込みます。
   * @override
   * @param {string} frame
   * @param {(err : Error | null) => void} callback
   */
  write(frame, callback) {
    fs.write(this.#fd, frame + "\n", callback);
  }


  /**
   * 同期的にファイルに書き込みます
   * @param {string} frame 
   */
  writeSync(frame) {
    fs.writeSync(this.#fd, frame + '\n');
  }

  get canSync() {
    return true;
  }

  /**
   * ファイルディスクリプタを一回閉じ再度開きます。
   */
  reload() {
    fs.closeSync(this.#fd);
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND;
    this.#fd = fs.openSync(this.#path, flags);
  }


  /**
   * ファイルディスクリプタを同期的に閉じます。
   * 冪等性を確保するため、二回目以降の呼び出しは無視されます。
   * @override
   */
  close() {
    if (this._isClosed) {
      return;
    }
    this._isClosed = true;
    fs.closeSync(this.#fd);
  }
}