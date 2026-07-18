import { error } from "node:console";
import { Transporter } from "./Transporter.js";
import { SyslogStmt } from "./SyslogStmt.js";

export class MultipleTransporter extends Transporter {

  /**
   * @typee Array<Transporter>
   */
  #transporters = [];
  #strategy = null;

  /**
   * @param {Array<Transporter>} transporters 
   * @param {"all"|"allSettled"|"race"|"any"} [strategyName="all"]
   */
  constructor(transporters, strategyName = "all") {
    super();
    this.#strategy = Promise[strategyName];
    if(typeof this.#strategy !== "function") {
      throw Error(`Invalid strategyName: ${strategyName}`)
    }

    for(const tp of transporters){
      this.#transporters.push(tp);
    }
  }

  /**
   * コンストラクタで指定されたTransporterたちのTransportを起動します。
   * @override
   * @param {SyslogStmt} payload 
   * @throws Error 何番目で失敗したかを示すメッセージとcauseに原因となったerrオブジェクトが入っています。
   */
  async transport(payload) {
    /*
    for(let index = 0; index < this.#transporters.length; index++) {
      try{ 
        this.#transporters[index].transport(payload);
      } catch {
        throw new Error(`Transporter {${index} faild: ${err.message}`, { cause: err });
      }
    }
    */

    const promises = this.#transporters.map( (transporter, index) => {
      try {
        return transporter.transport(payload);
      } catch (err) {
        throw new Error(`Transporter {${index} faild: ${err.message}`, { cause: err });
      }
    });

    return this.#strategy.call(Promise, promises);

  }
}