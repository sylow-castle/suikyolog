import { Transporter } from "./Transporter.js";

/**
 * コンソール出力をするトランスポーター
 */
export class ConsoleTransporter extends Transporter {
  /**
   * コンソールに出力する
   * @override
   * @async
   * @param {string} payload
   * @throw Error コンソール出力でエラーが発生した場合
   */
  async transport(payload) {
    console.log(payload);
  }
}