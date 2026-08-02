import { Transporter } from "./Transporter.js";

/**
 * 何もしないトランスポーターです。
 */
export class NullTransporter extends Transporter {

  /**
   * 何もしません。
   * @async
   * @param {SyslogStmt} payload 
   */
  async transport(_payload) {
  }

}