import * as Rfc5424Rule from "./Rfc5424Rule.js";

export class StructuredData {
  #elements = new Map(); // Map<SDID, Map<Key, Value>>
  #currentSdId = null;

  get element() {
    return this.#elements;
  }

  /**
   * 構造化データにキーと値のペアを追加する。
   * arg1はSD-ID、arg2はPARAM-NAME、arg3はPARAM-VALUEとして扱う。
   * arg3に値が指定されなかった場合は、arg1をPARAM-NAME、arg2をPARAM-VALUEとして扱う。
   * また、use(arg1)と同じ効果を持つ。
   * SD-PARAM(PARAM-VALUE)
   * @param {string} arg1 必須。null、空文字でもエラーを吐く
   * @param {string} arg2
   * @param {string} arg3
   * @returns {StructuredData}
   */
  add(arg1, arg2, arg3) {
    let sdId, key, value;
    if (arg1 === undefined) {
      throw new Error(`arg1 is required: ${arg1}.`);
    }

    if (arg3 === undefined && !(arg2 === undefined)) {
      // 2つ引数がある場合: add(key, value) -> 直前のSDIDを使用
      if (!this.#currentSdId) {
        throw new Error("No previous SDID found");
      }
      [sdId, key, value] = [this.#currentSdId, arg1, arg2];
    } else {
      // 3つ引数がある場合: add(sdId, key, value)
      [sdId, key, value] = [arg1, arg2, arg3];
    }

    if (typeof sdId !== "string") {
      throw new Error(`sdId is not string: ${sdId}.`);
    }

    if (typeof key !== "string" && key !== undefined) {
      throw new Error(`key is not string: ${key}.`);
    }

    if (typeof value !== "string" && value !== undefined) {
      throw new Error(`value is not string: ${value}.`);
    }

    this.#validateSDName(sdId);
    this.#validateSDName(key);
    value = Rfc5424Rule.escapeParamValue(value);

    // 状態の更新
    this.#currentSdId = sdId;

    // 以下、Mapへの追加処理...
    if (!this.#elements.has(sdId)) {
      this.#elements.set(sdId, new Map());
    }

    if (arg2 !== undefined) {
      this.#elements.get(sdId).set(key, value);
    }

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
    if (typeof sdId !== "string") {
      throw new Error(`sdId is not string: ${sdId}.`);
    }

    if (!this.#elements.has(sdId)) {
      throw new Error(`Not found sdId: ${sdId}.`)
    }

    this.#currentSdId = sdId;
    return this;
  }

  #validateSDName(name) {
    // 禁止文字のチェック
    if (Rfc5424Rule.hasSdNameExceptions(name)) {
      throw new Error(`SD-NAME has not allowed chars: ${name}`);
    }
    // 長さと文字種のチェック
    if (!(Rfc5424Rule.isValidSdName(name))) {
      throw new Error(`SD-NAME is 1-32 length: ${name}`);
    }

    return true;
  }
}