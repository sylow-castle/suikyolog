import * as EventType from "./EventType.js";
import { Writer } from "./Writer.js";

export class OnBackpressureWriter extends Writer {
  /**
   * @param {Writer} inner 
   * @returns {DropWriter}
   */
  static Drop(inner) {
    return new DropWriter(inner);
  }

  /**
   * @param {Writer} inner 
   * @returns {WaitWriter}
   */
  static Wait(inner) {
    return new WaitWriter(inner);
  }
}

/**
 * 直下（inner）がBACKPRESSURE/DRAINイベントを飛ばして来たらドロップを開始/停止します
 */
class DropWriter extends OnBackpressureWriter {
  #isDrop = false;
  #inner = null;

  constructor(inner) {
    super();
    this.#inner = inner;
  }

  /**
   * @override
   * @param {EventTarget} eventTarget
   */
  setEventTarget(eventTarget) {
    super.setEventTarget(eventTarget);

    eventTarget.addEventListener(EventType.BACKPRESSURE, (event) => {
      if (event.detail.src === this.inner) {
        this.#isDrop = true;
      }
    });

    eventTarget.addEventListener(EventType.DRAIN, (event) => {
      if (event.detail.src === this.inner) {
        this.isDrop = false;
      }
    });
  }

  /**
   * @override
   * @param {string} frame
   * @param {(err : Error | null) => void } callback
   */
  write(frame, callback) {
    if (this.#isDrop) {
      callback(null);
    } else {
      this.#inner.write(frame, callback);
    }
  }

  /**
   * @override
   * @param {string} frame 
   */
  writeSync(frame) {
    if (!this.#isDrop) {
      this.#inner.writeSync(frame)
    }
  }

}

/**
 * 直下（inner）が
 */
class WaitWriter extends OnBackpressureWriter {
  #inner = null;
  #isBackpressure = false;
  #drainPromise = null;
  #resolveDrain = null;

  /**
   * 
   * @param {Writer} inner 
   */
  constructor(inner) {
    super();
    this.#inner = inner;
  }

  /**
   * @override
   * @param {EventTarget} eventTarget
   */
  setEventTarget(eventTarget) {
    super.setEventTarget(eventTarget);

    eventTarget.addEventListener(EventType.BACKPRESSURE, (event) => {
      if (event.detail?.src !== this.#inner) {
        return;
      }
      this.#isBackpressure = true;
      if (this.#drainPromise) {
        return;
      }
      this.#drainPromise = new Promise((resolve) => {
        this.#resolveDrain = resolve;
      });
    });

    eventTarget.addEventListener(EventType.DRAIN, (event) => {
      if (event.detail?.src !== this.#inner) {
        return;
      }
      this.#isBackpressure = false;

      if (!this.#resolveDrain) {
        return;
      }

      const resolve = this.#resolveDrain;
      this.#drainPromise = null;
      this.#resolveDrain = null;
      resolve();
    });
  }

  /**
   * @ovberride
   * @param {string} frame
   * @param {(err : Error | null) => void} callback
   */
  async write(frame, callback) {
    if (this.#isBackpressure && this.#drainPromise) {
      await this.#drainPromise;
    }

    this.#inner.write(frame, callback);
  }

  /**
   * @override
   */
  close() {
    if (this.isClosed) {
      return;
    }
    super.close();
    this.#inner.close();
  }

  /**
   * @override
   */
  reload() {
    super.reload();
    this.#inner.reload();
  }

}