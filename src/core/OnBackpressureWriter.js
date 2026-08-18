import { EventType } from "./EventType.js";
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
  setEventtarget(eventTarget) {
    super.setEventtarget(eventTarget);

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

  get canSync() {
    return this.#inner.canSync;
  }
}

/**
 * 直下（inner）が
 */
class WaitWriter {
  #inner = null;

  /**
   * 
   * @param {Writer} inner 
   */
  constructor(inner) {
    this.#inner = inner;
  }

  /**
   * @override
   * @param {EventTarget} eventTarget
   */
  setEventtarget(eventTarget) {
    super.setEventtarget(eventTarget);

    eventTarget.addEventListener(EventType.BACKPRESSURE, async (event) => {
    });
  }

}