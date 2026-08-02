import { Writer } from "./Writer.js";
import * as EventType from "./EventType.js";

export class FetchWriter extends Writer {
  #config = null;
  #url = null;

  /**
   * 
   * @param {string} url 
   * @param {object} config 
   */
  constructor(url, config = {}) {
    super();
    this.#url = url;
    this.#config = structuredClone({
      ...config,
      method: config.method ?? "POST"
    });
  }

  /**
   * 
   * @override
   * @param {string} frame 
   */
  write(frame) {
    fetch(this.#url, {
      ...this.#config,
      body: frame
    }).then(res => {
      if (res.ok) {
        this._getEventTarget().dispatchEvent(new CustomEvent(EventType.WRITTEN, {
          detail: res
        }));
      } else {
        this._getEventTarget().dispatchEvent(new CustomEvent(EventType.ERROR, {
          detail: res
        }));
      }
    }).catch(err => {
      this._getEventTarget().dispatchEvent(new CustomEvent(EventType.ERROR, {
        error: err
      }));
    });
  }
}