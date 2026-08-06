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
  #incoming = [];
  #inflight = new Set();
  #incomingv = [];
  #inflightv = new Set();
  #isSync = false;

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
    if (this.#isSync) {
      fs.writeSync(this.#fileHandle, chunk);
    } else {
      this.#incoming.push(chunk);
      this.#flushAsync(callback, false);
    }

  }

  _writev(chunks, callback) {
    const buffers = chunks.map(item => item.chunk);

    if (this.#isSync) {
      fs.writevSync(this.#fileHandle, buffers);
    } else {
      this.#incomingv.push(buffers);
      this.#flushAsyncv(callback);
    }

  }

  flushSync() {
    while (this.#incoming.length > 0) {
      const chunk = this.#incoming.shift();
      fs.writeSync(this.#fileHandle, chunk);
    }

    while (this.#incomingv.length > 0) {
      const chunks = this.#incomingv.shift();
      fs.writevSync(this.#fileHandle, chunks);
    }

  }

  #flushAsync(callback) {
    const chunk = this.#incoming.shift();
    this.#inflight.add(chunk);
    fs.write(this.#fileHandle, chunk, (err) => {
      this.#inflight.delete(chunk);
      callback(err);
    });
  }

  #flushAsyncv(callback) {
    const chunks = this.#incomingv.shift();
    this.#inflightv.add(chunks);
    fs.writev(this.#fileHandle, chunks, (err) => {
      this.#inflightv.delete(chunks);
      callback(err);
    });

  }

  _destroy(err, callback) {
    if (this.#fileHandle !== null) {
      fs.close(this.#fileHandle, () => callback(err));
    } else {
      callback(err);
    }
  }

  _final(callback) {
    if (this.#fileHandle !== null) {
      fs.close(this.#fileHandle, callback);
      this.#fileHandle = null;
    }
  }
}