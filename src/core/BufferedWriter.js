import { Writer } from "./Writer.js";
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
  #maxQueueVolume = 16 * 1024; //byte
  #maxQueueLength = 100;       //entry
  #flushInterval = 100;        //ms
  #currentQueueVolume = 0;     //byte
  #maxBuffer = new Uint8Array(1024);
  #timeoutId = null;
  #encoder = new TextEncoder();
  #lastFlushTime = Date.now();
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
   * @param {number} length - default 100 entries
   * @param {number} interval - default 100 ms
   * @param {number} volume - default 16 * 1024 byte
   */
  constructor(inner, length = 100, interval = 100, volume = 16 * 1024) {
    super();
    this.#inner = inner;

    if (typeof length !== "number" || Number.isNaN(length)) {
      throw new Error(`invalid length: ${length}`);
    }

    if (typeof interval !== "number" || Number.isNaN(interval)) {
      throw new Error(`invalid interval: ${interval}`);
    }

    if (typeof volume !== "number" || Number.isNaN(volume)) {
      throw new Error(`invalid volume: ${volume}`);
    }

    this.#maxQueueLength = length;
    this.#flushInterval = interval;
    this.#maxQueueVolume = volume;
    this.#resetTimer()
  }

  //イベントループが回る非同期書き込みにはタイムアウトループで対応
  #resetTimer() {
    if (this.#timeoutId !== null) {
      clearTimeout(this.#timeoutId);
    }
    this.#timeoutId = setTimeout(() => {
      this.flush();
    }, this.#flushInterval);
  }

  write(data, callback) {
    //イベントループが回っていない場合に備えての経過時間確認
    //同期書き込みを想定した場合
    const currentTime = Date.now();
    const currentInterval = currentTime - this.#lastFlushTime;

    //文字データからバイト数計算してキューの大きさ（バイト）を計算
    const maxBufferLength = MAX_CHAR_BYTE * data.length;
    if (this.#maxBuffer.length < maxBufferLength) {
      this.#maxBuffer = new Uint8Array(maxBufferLength);
    }
    const { written } = this.#encoder.encodeInto(data, this.#maxBuffer);

    //改行分を勘案（2行目以降の場合のみ追加）
    const entryByteSize = written + (this.#incomingQueue.length >= 1 ? 1 : 0);
    this.#currentQueueVolume += entryByteSize;

    //背圧発生時に通知する
    this.#incomingQueue.push(data);

    //容量状態の更新
    const beforeVol = this.#stateVolume;
    //初期状態を入れることで状態nullは決してしない
    let afterVol = STATE.VOLUME.WRITABLE;

    if (this.#currentQueueVolume >= this.#maxQueueVolume ||
      this.#incomingQueue.length >= this.#maxQueueLength) {
      afterVol = STATE.VOLUME.BACKPRESSURE
    }

    this.#stateVolume = afterVol;

    if (beforeVol === STATE.VOLUME.WRITABLE && afterVol === STATE.VOLUME.BACKPRESSURE) {
      this._getEventTarget().dispatchEvent(new CustomEvent(EventType.BACKPRESSURE, {
        detail: {
          src: this
        }
      }));
    }

    if (this.#stateVolume === STATE.VOLUME.BACKPRESSURE ||
      currentInterval >= this.#flushInterval) {
      this.flush(callback);
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
      return;
    }

    const beforeExec = this.#stateExec
    let afterExec = STATE.EXEC.FLUSHING;

    if (beforeExec === STATE.EXEC.FLUSHING && afterExec === STATE.EXEC.FLUSHING) {
      return;
    }

    this.#lastFlushTime = Date.now();
    this.#stateExec = afterExec;
    const inflightQueue = this.#incomingQueue;
    const inflightVolume = this.#currentQueueVolume;
    const inflightText = inflightQueue.join("\n")
    this.#incomingQueue = [];
    this.#currentQueueVolume = 0;

    this.#inner.write(inflightText, (err) => {
      if (err) {
        this.#incomingQueue.unshift(...inflightQueue);
        this.#currentQueueVolume += inflightVolume;
        callback(err);
      }

      const beforeVol = this.#stateVolume;
      let afterVol = STATE.VOLUME.WRITABLE;
      if (this.#currentQueueVolume >= this.#maxQueueVolume ||
        this.#incomingQueue.length >= this.#maxQueueLength) {
        afterVol = STATE.VOLUME.BACKPRESSURE
      }

      if (beforeVol === STATE.VOLUME.BACKPRESSURE && afterVol === STATE.VOLUME.WRITABLE) {
        this._getEventTarget().dispatchEvent(new CustomEvent(EventType.DRAIN, {
          detail: {
            src: this
          }
        }));
      }

      this.#stateExec = STATE.EXEC.IDLE;

      if (this.#incomingQueue.length > 0 &&
        (this.#stateVolume === STATE.VOLUME.BACKPRESSURE ||
          Date.now() - this.#lastFlushTime >= this.#flushInterval)) {
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
    if (!this.#inner.canSync) {
      return;
    }

    this.#lastFlushTime = Date.now();
    this.#inner.writeSync(this.#incomingQueue.join('\n'));
    this.#currentQueueVolume = 0;
    this.#incomingQueue = [];

    const beforeVol = this.#stateVolume;
    let afterVol = STATE.VOLUME.WRITABLE;
    if (this.#currentQueueVolume >= this.#maxQueueVolume ||
      this.#incomingQueue.length >= this.#maxQueueLength) {
      afterVol = STATE.VOLUME.BACKPRESSURE
    }

    if (beforeVol === STATE.VOLUME.BACKPRESSURE && afterVol === STATE.VOLUME.WRITABLE) {
      this._getEventTarget().dispatchEvent(new CustomEvent(EventType.DRAIN));
    }

    this.#resetTimer();
  }

  get canSync() {
    return this.#inner.canSync;
  }

  /**
   * リソースのリロード処理を記述します。
   * @override
   */
  reload() {
    if (this.canSync) {
      this.flushSync();
    } else {
      //ベストエフォート
      this.flush();
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

    if (this.canSync) {
      this.flushSync();
    } else {
      //ベストエフォート
      this.flush();
    }

    if (this.#timeoutId !== null) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }

    if (typeof this.#inner.close === "function") {
      this.#inner.close();
    }

    this._isClosed = true;
  }

}