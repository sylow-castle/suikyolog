/**
 * トランスポーターの基底クラス。
 * @interface
 * @abstract
 */
export class Transporter {

  /**
   * 継承したクラスでオーバーライドしてください。非同期処理が前提です。
   * このメソッドは常に例外を投げます。
   * @async
   * @param {string} payload 
   * @throws {Error} 転送処理に失敗した場合。
   */
  async transport(payload) {
    throw new Error('Not implemented');
  }

}