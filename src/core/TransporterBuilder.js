import { FilterTransporter } from "./FilterTransporter.js";
import { FanoutTransporter } from "./FanoutTransporter.js";

export class TransporterBuilder {
  #first = null
  #transporters = null;


  /**
   * @param 最初に設定するログレベルフィルターのレベル
   * @returns {TransporterBuilder}
   */ 
  static start(level){
    const result = new TransporterBuilder(); 
    result.#transporters = [];
    result.filter((syslogStmt) => {return syslogStmt.isOutput(level)});
    return result;
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
    if (this.#transporters.length === 0) {
      const next = new FilterTransporter(condition)
      this.#first = next;
      this.#transporters.push(next);
    } else {
      const next = new FilterTransporter(condition)
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
   * @param { Encoder<T> | EncodedFunc<T> } encoder
   * @returns {CompiledTransporterBuilder<T>}
   */
  encodedBy(encoder){
    const last = this.#transporters.pop();
    this.#transporters.push(last);
    return new CompiledTransporterBuilder(this.#first, last, encoder);
  }

  /**
   * @param {function(FanoutTransporterBuilder): void}
   * @returns {FanoutTransporterBuilder}
   */
  fanout(callback) {
    const builder = new FanoutTransporterBuilder();
    callback(builder);

    const fanoutTransporter = builder.build();

    const current = this.#transporters.pop();
    current.setNext(fanoutTransporter);
    this.#transporters.push(current);
    this.#transporters.push(fanoutTransporter);

    return this;
  }

}

export class FanoutTransporterBuilder {
  #children = [];

  /**
   * 
   * @param {Transporter} child
   * @returns {FanoutTransporterBuilder}
   */
  add(child) {
    this.#children.push(child);
    return this;
  }

  /**
     * @returns {FanoutTransporter}
   */
  build() {
    const fanout = new FanoutTransporter(this.#children);
    return faunout;
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

  /**
   * 
   * @param {Transporter} first 
   * @param {Transporter} last 
   * @param { Encoder<T> | EncoderFunc<T> } encoder 
   */
  constructor(first, last, encoder) {
    this.#first = first;
    this.#last = last;

    if(typeof encoder === "function") {
      encoder = (syslogStmt) => {return encoder(syslogStmt)};
    }
    this.#encoder = encoder;
  }


  /**
   * @template T stringとかbyte[]とか
   * @param {Writer<T>} Tを受けて書き込む奴の型。コンソールとかファイルとか。
   * @return {FinieshedTransporterBuilder}
   */
  write(writer){
    const current = this.#last;
    writer.setEncoder(this.#encoder);
    this.#last.setNext(writer);
    return new FinishedTransporterBuilder(this.#first);
  }


}

class FinishedTransporterBuilder {
  #first = null

  constructor(first) {
    this.#first = first;
  }

  /**
   * @returns {Transporter}
   */
  end(){
    return this.#first;
  }
}
