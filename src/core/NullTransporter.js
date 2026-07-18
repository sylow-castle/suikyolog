import { SyslogStmt } from "./SyslogStmt.js";
import { Transporter } from "./Transporter.js";

/**
 * 何もしないトランスポーターです。
 */
export class NullTransporter extends Transporter  {

  /**
   * 何もしません。
   * @async
   * @param {SyslogStmt} payload 
   */
  async transport(payload) {
  }

  /**
   * 何もしません。
   * @param {Encoder} encoder 
   */
  setEncoder(encoder) {
  }

}