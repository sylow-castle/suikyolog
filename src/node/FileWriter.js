import { Writer } from "../core/Writer.js";
import { Writable } from "node:stream";
import { finished } from "node:stream/promises";
import fs from "fs";

/**
 * 
 * @implements {Writer}
 */
export class SimpleSyncFileWriter extends Writer {
  /**
   * @type {FileStreamWriter}
   */
  #innerWriter = null;
  /**
   * 
   * @param {object} config
   * @param {string} config.path
   */
  constructor(config) {
    super(config);
    this.#innerWriter = new FileStreamWriter(config.path);
    this.#innerWriter.on("error", err => {
      this._getEventTarget().dispatchEvent(new CustomEvent("error", { detail: err }));
    });
  }

  /**
   * イベントターゲットを設定しま す
   * @override
   * @param {EventTarget} eventTarget 
   */
  setEventTarget(eventTarget) {
    super.setEventTarget(eventTarget);

    this._getEventTarget().addEventListener("flush", async () => {
      if (this.#isEnding) {
        return;
      }
      this.#isEnding = true;
      this.#innerWriter.end();
      await finished(this.#innerWriter);
      this._getEventTarget().dispatchEvent(new CustomEvent("flushed"));
    })

  }

  write(data) {
    try {
      this.#innerWriter.write(data + '\n');
    } catch (err) {
      this._getEventTarget().dispatchEvent(new CustomEvent("error", { detail: err }));
    }
  }

  end() {
    this.#innerWriter.end();
  }

  async finished() {
    return finished(this.#innerWriter);
  }

}

class FileStreamWriter extends Writable {
  #fileHandle = null;

  constructor(path, eventTarget, options = {}) {
    super({
      highWaterMark: options.highWaterMark || 16 * 1024,
      ...options
    });
  }

  _construct(callback) {
    //const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_SYNC;
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND;
    fs.open(this.#path, flags, (err, fd) => {
      if (!err) {
        this.#fileHandle = fd;
      }
      callback(err);
    });
  }

  _write(chunk, encoding, callback) {
    if (!this.#eventTarget) {
      callback(new Error("EventTarget is not set"));
    }

    fs.write(this.#fileHandle, chunk, callback);
  }

  _writev(chunks, callback) {
    if (!this.#eventTarget) {
      callback(new Error("EventTarget is not set"));
    }

    const buffers = chunks.map(item => item.chunk);
    const combined = Buffer.concat(buffers);

    fs.write(this.#fileHandle, combined, callback);
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