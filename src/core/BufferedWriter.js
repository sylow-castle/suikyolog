import { Writer } from "./Writer.js";

const MAX_CHAR_BYTE = 4;
export class BufferedWriter extends Writer {
  #inner = null;
  #queue = [];
  #maxQueueVolume = 16 * 1024; //byte
  #maxQueueLength = 100;       //entry
  #flushInterval = 100;        //ms
  #currentQueueVolume = 0;     //byte
  #maxBuffer = new Uint8Array(1024);
  #timeoutId = null;
  #encoder = new TextEncoder();
  #lastFlushTime = Date.now();

  /**
   * @param {Writer} inner　writer which wanted to add buffering
   * @param {number} volume - default 16 * 1024 byte
   * @param {number} length - default 100 entries
   * @param {number} interval - default 100 ms
   */
  constructor(inner, length = 100, interval = 100, volume = 16 * 1024) {
    super({});
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

  write(data) {
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
    const entryByteSize = written + (this.#queue.length >= 1 ? 1 : 0);
    this.#currentQueueVolume += entryByteSize;

    this.#queue.push(data);

    if (this.#currentQueueVolume >= this.#maxQueueVolume ||
      this.#queue.length >= this.#maxQueueLength ||
      currentInterval >= this.#flushInterval) {
      this.flush();
    }
  }

  /**
   * 
   * @returns 
   */
  flush() {
    if (this.#queue.length === 0) {
      this.#resetTimer();
      return;
    }

    this.#inner.write(this.#queue.join('\n'));

    this.#lastFlushTime = Date.now();
    this.#currentQueueVolume = 0;
    this.#queue = [];

    this.#resetTimer();
  }

  /**
   * バッファをフラッシュする
   * 内部のwriterが同期書き込みをサポートしていない場合は何もしません
   * @override
   */
  flushSync() {
    if (this.#queue.length === 0) {
      return;
    }
    if (!this.#inner.canSync) {
      return;
    }

    this.#inner.writeSync(this.#queue.join('\n'));

    this.#lastFlushTime = Date.now();
    this.#currentQueueVolume = 0;
    this.#queue = [];

  }

  get canSync() {
    return this.#inner.canSync;
  }

  /**
   * クローズ処理
   */
  close() {
    this.flush();
    if (this.#timeoutId !== null) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
    this.#inner.close?.();
  }

}