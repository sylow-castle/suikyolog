import { FilterTransporter } from "./FilterTransporter.js";
import { FanoutTransporter } from "./FanoutTransporter.js";
import { Transporter } from "./Transporter.js";

export class TransporterBuilder {
  #first = null
  #transporters = null;
  #eventTarget = null;

  constructor(eventTarget = new EventTarget()) {
    this.#eventTarget = eventTarget;
  }

  static build(callback, eventTarget = new EventTarget()) {
    const builder = new TransporterBuilder(eventTarget);
    builder.#eventTarget = eventTarget;

    if (typeof callback === "function") {
      return callback(builder);
    }
  }

  /**
   * @param {number} 最初に設定するログレベルフィルターのレベル
   * @returns {TransporterBuilder}
   */
  static start(level, eventTarget = new EventTarget()) {
    const result = new TransporterBuilder(eventTarget);
    result.#transporters = [];
    result.filter(syslogStmt => syslogStmt.isOutput(level));
    return result;
  }

  /**
   * @param {number} level 最初に設定するログレベルフィルターのレベル
   * @returns {TransporterBuilder}
   */
  start(level) {
    this.#transporters = [];
    this.filter(syslogStmt => syslogStmt.isOutput(level));
    return this;
  }

  /**
   * @callback Condition
   * @param {SyslogStmt}
   * @returns {boolean}
   */
  /**
   * 
   * @param {Condition} condition 
   * @returns {TransporterBuilder}
   */
  filter(condition) {
    const next = new FilterTransporter(condition)
    next.setEventTarget(this.#eventTarget);

    if (this.#transporters.length === 0) {
      this.#first = next;
      this.#transporters.push(next);
    } else {
      const current = this.#transporters.pop();
      current.setNext(next);
      this.#transporters.push(current);
      this.#transporters.push(next);
    }
    return this;
  }

  /**
   * @template T エンコード後の型、stringやbyte[]
   * @callback EncodeFunc<T>
   * @param {SyslogStmt}
   * @returns {T}
   **/

  /**
   * @param { Encoder<T> | EncodeFunc<T> } encoder
   * @returns {CompiledTransporterBuilder<T>}
   */
  encodedBy(encoder) {
    const last = this.#transporters.pop();
    this.#transporters.push(last);
    return new CompiledTransporterBuilder(this.#first, last, encoder, this.#eventTarget);
  }

  /**
   * @param {function(FanoutTransporterBuilder): void}
   * @returns {FanoutTransporterBuilder}
   */
  fanout(callback) {
    const builder = new FanoutTransporterBuilder(this.#eventTarget);
    callback(builder);

    const fanoutTransporter = builder.build();
    const current = this.#transporters.pop();
    current.setNext(fanoutTransporter);
    this.#transporters.push(current);
    this.#transporters.push(fanoutTransporter);

    return new FinishedTransporterBuilder(this.#first, this.#eventTarget);
  }

}

export class FanoutTransporterBuilder {
  #children = [];
  #eventTarget = null;

  /**
   * @param {EventTarget} eventTarget
   */
  constructor(eventTarget) {
    this.#eventTarget = eventTarget;
  }

  start(level) {
    return TransporterBuilder.start(level, this.#eventTarget);
  }

  /**
   * 
   * @param {Transporter} child
   * @returns {FanoutTransporterBuilder}
   */
  add(child) {
    const transporter = child?.transporter ?? child;
    if (transporter instanceof Transporter) {
      this.#children.push(transporter);
    } else {
      throw new Error(`child is not a Transporter: ${transporter}`);
    }
    return this;
  }

  /**
     * @returns {FanoutTransporter}
   */
  build() {
    const fanout = new FanoutTransporter(this.#children);
    fanout.setEventTarget(this.#eventTarget);
    return fanout;
  }

}

/**
 * @template T エンコードされた型、stringとかbyte[]とか
 * @class CompiledTransporterBuilder<T>
 */
class CompiledTransporterBuilder {
  #encoder = null;
  #first = null;
  #last = null;
  #eventTarget = null;
  #writerStack = [];

  /**
   * 
   * @param {Transporter} first 
   * @param {Transporter} last 
   * @param { Encoder<T> | EncoderFunc<T> } encoder 
   */
  constructor(first, last, encoder, eventTarget) {
    this.#first = first;
    this.#last = last;
    this.#eventTarget = eventTarget;

    if (typeof encoder === "function") {
      encoder = syslogStmt => encoder(syslogStmt);
    }
    this.#encoder = encoder;
  }

  /**
   * @callback WriterDecorator
   * @param {Writer} writer
   * @returns {Writer}
   */
  /**
   * 
   * @param {WriterDecorator} writerCallback 
   * @returns {this}
   */
  via(writerCallback) {
    this.#writerStack.push(writerCallback);
    return this;
  }

  /**
   * @template T stringとかbyte[]とか
   * @param {Writer<T>} Tを受けて書き込む奴の型。コンソールとかファイルとか。
   * @return {FinieshedTransporterBuilder}
   */
  write(writer) {
    writer.setEncoder(this.#encoder);
    writer.setEventTarget(this.#eventTarget);

    const resultWriter = this.#writerStack.reduceRight((innerWriter, callback) => {
      const newWriter = callback(innerWriter);
      newWriter.setEncoder(this.#encoder);
      newWriter.setEventTarget(this.#eventTarget);
      return newWriter;
    }, writer);

    this.#last.setNext(resultWriter);

    return new FinishedTransporterBuilder(this.#first, this.#eventTarget);
  }

}

class FinishedTransporterBuilder {
  #first = null
  #eventTarget = null;

  constructor(first, eventTarget) {
    this.#first = first;
    this.#eventTarget = eventTarget;
    this.#first.setEventTarget(eventTarget);
  }

  /**
   * @returns {Transporter}
   */
  end() {
    return { transporter: this.#first, eventTarget: this.#eventTarget };
  }
}
