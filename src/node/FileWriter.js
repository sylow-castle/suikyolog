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
export class SimpleSyncFileWriter extends Writer {
  /**
   * @type {FileStreamWriter}
   */
  #innerWriter = null;
  #isClosed = false;
  #backpressureStrategy = BackpressureStrategy.Wait();

  /**
   * 
   * @param {object} config
   * @param {string} config.path
   */
  constructor(config) {
    super(config);
    this.#innerWriter = new FileStreamWriter(config.path);
    this.#innerWriter.on(EventType.ERROR, err => {
      this._getEventTarget().dispatchEvent(new CustomEvent(EventType.ERROR, { detail: err }));
    });
  }

  /**
   * イベントターゲットを設定します
   * @override
   * @param {EventTarget} eventTarget 
   */
  setEventTarget(eventTarget) {
    super.setEventTarget(eventTarget);

    this._getEventTarget().addEventListener(EventType.CLOSE, async () => {
      if (this.#isClosed) {
        return;
      }
      this.#isClosed = true;
      this.#innerWriter.end();
      await finished(this.#innerWriter);
      this._getEventTarget().dispatchEvent(new CustomEvent(EventType.CLOSED));
    })

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

  end() {
    this.#innerWriter.end();
  }

  async finished() {
    return finished(this.#innerWriter);
  }

}

class FileStreamWriter extends Writable {
  #fileHandle = null;
  #path = null;

  constructor(path, eventTarget, options = {}) {
    super({
      highWaterMark: options.highWaterMark ?? 64 * 1024,
      ...options
    });

    this.#path = path;
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