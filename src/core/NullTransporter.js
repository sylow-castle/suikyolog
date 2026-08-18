import { Transporter } from "./Transporter.js";

/**
 * 何もしないトランスポーターです。
 */
export class NullTransporter extends Transporter {

  /**
   * 何もしません。
   * @param {SyslogStmt} payload 
   */
  transport(_payload) {
  }

}