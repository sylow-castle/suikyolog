import { Writer, SyncWriter } from "./Writer.js";
import * as EventType from "./EventType.js"

const MAX_CHAR_BYTE = 4;

const STATE = Object.freeze({
  EXEC: {
    IDLE: "idle",
    FLUSHING: "flushing"
  },
  VOLUME: {
    WRITABLE: "writable",
    BACKPRESSURE: "backpressure"
  }
});

export class BufferedWriter extends Writer {
  #inner = null;
  #incomingQueue = [];
  #incomingQueueVolume = 0;     //byte
  #flushInterval = 100;        //ms
  #lastFlushTime = 0;
  #flushPolicy = null;
  #timeoutId = null;
  #utf8Calculator = new UTF8Calculator();
  #_now = null;
  #_setTimeout = null;
  #_clearTimeout = null;

  /**
   * @property { "writable" | "backpressure"} volumeState
   */
  #stateVolume = STATE.VOLUME.WRITABLE;

  /**
   * @property { "idle" | "flushing"} execState
   */
  #stateExec = STATE.EXEC.IDLE;

  /**
   * @param {Writer} inner - writer which wanted to add buffering
   * @param {Object} options 
   * @param {number} options.length - default 100 entries
   * @param {number} options.interval - default 100 ms
   * @param {number} options.volume - default 16 * 1024 byte
   */
  constructor(inner, options) {
    super();
    this.#inner = inner;

    const defaultOptions = {
      length: 100,
      interval: 100,
      volume: 16 * 1024,
      delimiter: "\n",
      _now: Date.now,
      _setTimeout: setTimeout,
      _clearTimeout: clearTimeout,
      _flushPolicyClass: FlushPolicy
    }
    options = {
      ...defaultOptions,
      ...options
    }

    const { length, interval, volume } = options;

    if (typeof length !== "number" || Number.isNaN(length)) {
      throw new Error(`invalid length: ${length}`);
    }

    if (typeof interval !== "number" || Number.isNaN(interval)) {
      throw new Error(`invalid interval: ${interval}`);
    }

    if (typeof volume !== "number" || Number.isNaN(volume)) {
      throw new Error(`invalid volume: ${volume}`);
    }


    this.#_now = options._now;
    this.#_setTimeout = options._setTimeout;
    this.#_clearTimeout = options._clearTimeout;

    this.#flushPolicy = new options._flushPolicyClass(volume, length);
    this.#flushInterval = interval;
    this.#lastFlushTime = this.#_now();
  }

  //イベントループが回る非同期書き込みにはタイムアウトループで対応
  #resetTimer() {
    if (this.#timeoutId !== null) {
      this.#_clearTimeout(this.#timeoutId);
    }
    this.#timeoutId = this.#_setTimeout(() => {
      this.flush((err) => {
        if (err) {
          this._getEventTarget().dispatchEvent(new CustomEvent(EventType.ERROR, {
            detail: {
              src: this,
              err: err,
            }
          }));
        }
      });
    }, this.#flushInterval);
  }

  write(data, callback) {
    if (this.#timeoutId === null) {
      this.#resetTimer();
    }

    //イベントループが回っていない場合に備えての経過時間確認
    const currentInterval = this.#_now() - this.#lastFlushTime;

    //文字データからバイト数計算してキューの大きさ（バイト）を計算
    const written = this.#utf8Calculator.calculateByte(data);

    //改行分を勘案（2行目以降の場合のみ追加）
    const entryByteSize = written + (this.#incomingQueue.length >= 1 ? 1 : 0);
    this.#incomingQueueVolume += entryByteSize;

    this.#incomingQueue.push(data);
    this.#updateStateVolume();

    if (this.#stateVolume === STATE.VOLUME.BACKPRESSURE ||
      currentInterval >= this.#flushInterval) {
      this.flush(callback);
    } else {
      callback(null)
    }
  }

  /**
   * 
   * @returns 
   * @param {(err) => void } callback
   */
  flush(callback) {
    if (this.#incomingQueue.length === 0) {
      this.#resetTimer();
      callback(null);
      return;
    }

    const beforeExec = this.#stateExec
    const afterExec = STATE.EXEC.FLUSHING;

    if (beforeExec === STATE.EXEC.FLUSHING && afterExec === STATE.EXEC.FLUSHING) {
      callback(null);
      return;
    }
    this.#stateExec = afterExec;
    this.#lastFlushTime = this.#_now();

    const inflightQueue = this.#incomingQueue;
    const inflightVolume = this.#incomingQueueVolume;
    const inflightText = inflightQueue.join("\n")
    this.#incomingQueue = [];
    this.#incomingQueueVolume = 0;

    this.#inner.write(inflightText, (err) => {
      if (err) {
        this.#incomingQueue.unshift(...inflightQueue);
        this.#incomingQueueVolume += inflightVolume;
        callback(err);
      } else {
        callback(null);
      }

      this.#updateStateVolume();
      this.#stateExec = STATE.EXEC.IDLE;

      if (this.#incomingQueue.length > 0 &&
        (this.#stateVolume === STATE.VOLUME.BACKPRESSURE ||
          this.#_now() >= this.#lastFlushTime + this.#flushInterval)) {
        //同期的にコールバックを実行する場合のスタックオーバーフロー避け
        queueMicrotask(() => this.flush(callback));
      }
    });

    this.#resetTimer();
  }

  /**
   * バッファをフラッシュする
   * 内部のwriterが同期書き込みをサポートしていない場合は何もしません
   * @override
   */
  flushSync() {
    if (this.#incomingQueue.length === 0) {
      return;
    }
    if (!(this.#inner instanceof SyncWriter)) {
      return;
    }

    this.#lastFlushTime = this.#_now();
    this.#inner.writeSync(this.#incomingQueue.join('\n'));
    //書き込みは同期なので特に気にせず状態をリセットできる。
    this.#incomingQueueVolume = 0;
    this.#incomingQueue = [];
    this.#_clearTimeout(this.#timeoutId);
    this.#timeoutId = null;

    this.#updateStateVolume();

  }

  #updateStateVolume() {
    const beforeVol = this.#stateVolume;
    let afterVol = STATE.VOLUME.WRITABLE;
    if (this.#flushPolicy.estimate(this.#incomingQueueVolume, this.#incomingQueue.length)) {
      afterVol = STATE.VOLUME.BACKPRESSURE;
    }

    if (beforeVol === STATE.VOLUME.WRITABLE && afterVol === STATE.VOLUME.BACKPRESSURE) {
      this._getEventTarget().dispatchEvent(this.#createCustomEvent(EventType.BACKPRESSURE));
    } else if (beforeVol === STATE.VOLUME.BACKPRESSURE && afterVol === STATE.VOLUME.WRITABLE) {
      this._getEventTarget().dispatchEvent(this.#createCustomEvent(EventType.DRAIN));
    }

    this.#stateVolume = afterVol;
  }

  /**
   * 
   * @param {string} eventType 
   * @returns {CustomEvent}
   */
  #createCustomEvent(eventType) {
    return new CustomEvent(eventType, {
      detail: {
        src: this
      }
    });
  }

  /**
   * リソースのリロード処理を記述します。
   * @override
   */
  reload() {
    if (this.#inner instanceof SyncWriter) {
      this.flushSync();
    } else {
      //ベストエフォート
      this.flush(() => { });
    }

    this.#inner.reload();
  }

  /**
   * クローズ処理。何度呼んでもよい。
   * @override
   */
  close() {
    if (this._isClosed) {
      return;
    }

    if (this.#inner instanceof SyncWriter) {
      this.flushSync();
    } else {
      //ベストエフォート
      this.flush(() => { });
    }

    if (this.#timeoutId !== null) {
      this.#_clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }

    if (typeof this.#inner.close === "function") {
      this.#inner.close();
    }

    this._isClosed = true;
  }

}

export class FlushPolicy {
  #maxVolume = 0;
  #maxLength = 0;

  constructor(volume, length) {
    this.#maxLength = length;
    this.#maxVolume = volume;
  }

  /**
   * flushが必要かどうかを推定する
   * @param {number} volume 
   * @param {number} length 
   * @returns {boolean} trueならflushすべき
   */
  estimate(volume, length) {
    return volume >= this.#maxVolume || length >= this.#maxLength
  }

}

export class UTF8Calculator {
  #encoder = new TextEncoder();
  #maxBuffer = new Uint8Array(1024);

  /**
   * 文字列のバイト数（UTF8エンコーディング）を計算する
   * @param {string} frame 
   * @returns {number}
   */
  calculateByte(frame) {
    const maxBufferLength = MAX_CHAR_BYTE * frame.length;
    if (this.#maxBuffer.length < maxBufferLength) {
      this.#maxBuffer = new Uint8Array(maxBufferLength);
    }
    const { written } = this.#encoder.encodeInto(frame, this.#maxBuffer);
    return written;
  }

}