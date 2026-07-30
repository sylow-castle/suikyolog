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
    super(options);
    this.#path = options.path;
    //    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND;
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_DSYNC;
    this.#fd = fs.openSync(this.#path, flags);
  }

  write(data) {
    fs.writeSync(this.#fd, data + '\n');
  }

  writeSync(data) {
    fs.writeSync(this.#fd, data + '\n');
  }

  get canSync() {
    return true;
  }

  close() {
    fs.closeSync(this.#fd);
  }
}