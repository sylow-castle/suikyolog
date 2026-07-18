import { SyslogStmt } from "./SyslogStmt.js";
import { Transporter } from "./Transporter.js";

/**
 * 指定した条件でフィルタリングします
 * 
 */
export class FilterTransporter extends Transporter  {
  #condition = null

  constructor(condition){
    super();
    this.#condition = condition
  }

  /**
   * 保存された条件に合致するものを次に流します。
   * @async
   * @param {SyslogStmt} payload 
   */
  async transport(payload) {
    if(this.#condition(payload)){
      this.next(payload)
    }
  }
}