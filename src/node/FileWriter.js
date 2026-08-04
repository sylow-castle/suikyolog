import { Writer } from "../core/Writer.js";
import { Writable } from "node:stream";
import { finished } from "node:stream/promises"; EventType
import { BackpressureStrategy } from "./BackpressureStrategy.js";
import fs from "fs";
import * as EventType from "../core/EventType.js";

/**
 * 
 * @implements {Writer}
 */
export class StreamFileWriter extends Writer {
  /**
   * @type {FileStreamWriter}
   */
  #innerWriter = null;
  #backpressureStrategy = BackpressureStrategy.Wait();

  /**
   * 
   * @param {object} config
   * @param {string} config.path
   * @param {BackpressureStrategy} config.backpressure
   */
  constructor(config) {
    super();
    this.#backpressureStrategy = config.backpressure ?? BackpressureStrategy.Wait();
    this.#innerWriter = new FileStreamWriter(config.path);
    this.#innerWriter.on(EventType.ERROR, err => {
      this._getEventTarget().dispatchEvent(new CustomEvent(EventType.ERROR, { detail: err }));
    });
  }

  write(data) {
    try {
      if (!this.#backpressureStrategy.isShouldWrite()) {
        return;
      }

      const canContinue = this.#innerWriter.write(data + '\n');
      if (!canContinue) {
        this.#backpressureStrategy.handleBackpressure(this.#innerWriter, this._getEventTarget());
      }

    } catch (err) {
      this._getEventTarget().dispatchEvent(new CustomEvent(EventType.ERROR, { detail: err }));
    }
  }

  /**
   * ファイルハンドルを開きなおします
   * @override
   */
  reload() {
    this.#innerWriter.reload();
  }

  /**
   * 
   * @override
   */
  close() {
    if (this._isClosed) {
      return;
    }
    this._isClosed = true;
    this.#innerWriter.end();
    finished(this.#innerWriter);
  }

}

class FileStreamWriter extends Writable {
  #fileHandle = null;
  #path = null;
  get #flags() {
    //return fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_SYNC;
    return fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND;
  }
  constructor(path, eventTarget, options = {}) {
    super({
      highWaterMark: options.highWaterMark ?? 64 * 1024,
      ...options
    });

    this.#path = path;
  }

  _construct(callback) {
    this.#open(callback);
  }

  #open(callback) {
    fs.open(this.#path, this.#flags, (err, fd) => {
      if (!err) {
        this.#fileHandle = fd;
      }
      callback(err);
    });

  }

  reload() {
    fs.closeSync(this.#fileHandle);
    this.#fileHandle = fs.openSync(this.#path, this.#flags);
  }

  _write(chunk, encoding, callback) {
    fs.write(this.#fileHandle, chunk, callback);
  }

  _writev(chunks, callback) {
    const buffers = chunks.map(item => item.chunk);

    fs.writev(this.#fileHandle, buffers, callback);
  }

  _destroy(err, callback) {
    if (this.#fileHandle !== null) {
      fs.close(this.#fileHandle, () => callback(err));
    } else {
      callback(err);
    }
  }

  _final(callback) {
    fs.close(this.#fileHandle, callback);
  }
}