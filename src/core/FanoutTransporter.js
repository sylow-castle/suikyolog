import { Transporter } from "./Transporter.js";

export class FanoutTransporter extends Transporter {

  /**
   * @typee Array<Transporter>
   */
  #children = [];

  /**
   * @param {Array<Transporter>} transporters 
   */
  constructor(transporters) {
    super();
    for (const tp of transporters) {
      this.#children.push(tp);
    }
  }

  /**
   * コンストラクタで指定されたTransporterたちのTransportを起動します。
   * @override
   * @param {SyslogStmt} payload 
   * @throws Error 何番目で失敗したかを示すメッセージとcauseに原因となったerrオブジェクトが入っています。
   */
  transport(payload) {
    this.#children.map((transporter, index) => {
      try {
        transporter.transport(payload);
      } catch (err) {
        throw new Error(`Transporter {${index} faild: ${err.message}`, { cause: err });
      }
    });
  }

  /**
   * @override
   */
  close() {
    if (this._isClosed) {
      return;
    }
    this.#children.forEach(child => child.close());
    this._isClosed = true;
  }


  /**
   * @override
   */
  reload() {
    this.#children.forEach(child => child.reload());
  }
}