import { SyslogStmt } from "./SyslogStmt.js";

export class StructuredData {
  #elements = new Map(); // Map<SDID, Map<Key, Value>>
  #currentSdId = null;

  /**
   * 構造化データにキーと値のペアを追加する。
   * arg1はSD-ID、arg2はPARAM-NAME、arg3はPARAM-VALUEとして扱う。
   * arg3に値が指定されなかった場合は、arg1をPARAM-NAME、arg2をPARAM-VALUEとして扱う。
   * また、use(arg1)と同じ効果を持つ。
   * SD-PARAM(PARAM-VALUE)
   * @param {string} arg1
   * @param {string} arg2
   * @param {string} arg3
   * @returns {StructuredData}
   */
  add(arg1, arg2, arg3) {
    let sdId, key, value;

    if (arg3 !== undefined) {
      // 3つ引数がある場合: add(sdId, key, value)
      [sdId, key, value] = [arg1, arg2, arg3];
    } else {
      // 2つ引数がある場合: add(key, value) -> 直前のSDIDを使用
      if (!this.#currentSdId) {
        throw new Error("No previous SDID found");
      }
      [sdId, key, value] = [this.#currentSdId, arg1, arg2];
    }

    this.#validateSDName(sdId);
    this.#validateSDName(key);
    value = SyslogStmt.escapeControlChars(this.#escape(value));

    // 状態の更新
    this.#currentSdId = sdId;

    // 以下、Mapへの追加処理...
    if (!this.#elements.has(sdId)) {
      this.#elements.set(sdId, new Map());
    }
    this.#elements.get(sdId).set(key, value);

    return this;
  }

  /**
   * addを呼び出すだけです。addという語がしっくり来ない時にどうぞ。
   * @param {string} arg1 
   * @param {string} arg2 
   * @param {string} arg3 
   * @returns {StructuredData}
   * @see {@link add} addメソッドを参照
   */
  set(arg1, arg2, arg3) {
    return this.add(arg1, arg2, arg3);
  }

  /**
   * 指定したSDIDを現在の編集対象にする。
   * @param {*} sdId 
   * @returns {StructuredData}
   */
  use(sdId) {
    this.#currentSdId = sdId;
    return this;
  }

  #escape(val) {
    // ], ", \ をエスケープする処理
    return String(val).replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/]/g, '\\]');
  }

  toString() {
    if (this.#elements.size === 0) {
      return SyslogStmt.NILVALUE;
    }

    let res = "";
    for (const [sdId, params] of this.#elements) {
      res += `[${sdId}`;
      for (const [k, v] of params) {
        res += ` ${k}="${v}"`;
      }
      res += "]";
    }
    return res;
  }

  #validateSDName(name) {
    // 長さのチェック
    if (!/^[\x21-\x7E]{1,32}$/.test(name)) {
      throw new Error("SD-NAMEは1〜32文字の範囲で指定してください。");
    }

    // 禁止文字のチェック
    if (/[=\]"\s]/.test(name)) {
      throw new Error('SD-NAMEに不正な文字（=, 空白, ], "）が含まれています。');
    }

    return true;
  }
}