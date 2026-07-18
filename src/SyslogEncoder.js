import { Encoder } from "./Encoder.js";
import { ImmutableStructuredData, StructuredData } from "./MutableStructuredData.js";
import { NILVALUE, FACILITY_STR, SEVERITY_STR } from "./Rfc5424Rule.js";


const MS_CACHE_SIZE = 1000;
let tmp = new Array(MS_CACHE_SIZE);
for (let ms = 0; ms < MS_CACHE_SIZE; ms++) {
  tmp[ms] = "." + ms.toString().padStart(3, "0") + "Z";
}
const MS_CACHE = Object.freeze(tmp);

const PRI_CACHE_SIZE = FACILITY_STR.length * SEVERITY_STR.length;
tmp = new Array(PRI_CACHE_SIZE);
for (let pri = 0; pri <= PRI_CACHE_SIZE; pri++) {
  tmp[pri] = "<" + pri.toString() + ">";
}
const PRI_CACHE = Object.freeze(tmp);
const SP = " ";


/**
 * @implements {Encoder}
 */
export class SyslogEncoder {
  #structuredDataEncoder = new StructuredDataEncoder();
  #timestampCache = "";
  #timestampCacheSec = 0;
  /**
   * @param {import("./SyslogStmt.js").SyslogStmt} syslogStmt
   * @returns {string}
   */
  encode(syslogStmt) {
    const header = this.#header(syslogStmt);
    const structuredData = this.#structuredDataEncoder.encode(syslogStmt.structuredData);
    const rawMsg = syslogStmt.msg ? syslogStmt.msg : "";
    let msg = "";
    if (rawMsg !== "") {
      msg = " ".concat("\uFEFF", Encoder.escapeControlChars(rawMsg));
    }

    return `${header} ${structuredData}${msg}`;
  }

  /**
   * ヘッダーを生成する。
   * @param {import("./SyslogStmt.js").SyslogStmt} syslogStmt
   * @returns {string}
   */
  #header(syslogStmt) {
    /**
     * 返却値を読みやすくするために一旦変数で受けてる
     */
    const pri = PRI_CACHE[syslogStmt.pri];
    const ver = syslogStmt.version;
    const host = syslogStmt.hostname;
    const app = syslogStmt.appname;
    const proc = syslogStmt.procId;
    const msgId = syslogStmt.messageId;

    const timeSec = Math.floor(syslogStmt.timestamp / 1000);
    if (this.#timestampCacheSec !== timeSec) {
      this.#timestampCacheSec = timeSec;
      this.#timestampCache = new Date(syslogStmt.timestamp).toISOString().slice(0, 19);
    }

    const timestamp = this.#timestampCache + MS_CACHE[syslogStmt.timestamp - (timeSec * 1000)];

    // 速くするために読みやすさを捨てる
    //return `${pri} ${ver} ${timestamp} ${host} ${app} ${proc} ${msgId}`;
    return pri + ver + SP + timestamp + SP + host + SP + app + SP + proc + SP + msgId;
  }
}
/**
 * 
 * @abstract
 */
export class StructureDataVisitor {
  /**
   * @abstract
   * @param {string} sdId 
   */
  visitStartSdId(sdId) {
    throw new Error('not implemented');
  }

  /**
   * @abstract
   */
  visitEndSdId() {
    throw new Error('not implemented');
  }


  /**
   * @abstract
   * @param {string} key 
   * @param {string} value 
   */
  visitParam(key, value) {
    throw new Error('not implemented');
  }
}

class RingBUfferCache {
  static #SIZE = 64
  #keys = new Array(RingBUfferCache.#SIZE).fill(null);
  #values = new Array(RingBUfferCache.#SIZE).fill(null);
  #cursor = 0;

  constructor(size) {
    for(let index = 0; index < RingBUfferCache.#SIZE;index++) {
      this.#keys[index] = null;
    }
  }

  get(key) {
    for(let index = 0; index < RingBUfferCache.#SIZE;index++) {
      if(this.#keys[index] === key) {
        return this.#values[index];
      }
    }

    return null;    
  }

  set(key, value) {
    this.#keys[this.#cursor] = key;
    this.#values[this.#cursor] = value;
    this.#cursor = ( this.#cursor + 1) % RingBUfferCache.#SIZE 
  }
  
}

/**
 * @implements {StructureDataVisitor}
 */
export class StructuredDataEncoder {
  #cache = new RingBUfferCache();
  #strBuffer = null;
  #paramsBuffer = null;

  /**
   * structureDataをキャッシュして保持します。structureDataの後からの変更は止めてください。
   * @param {StructuredData} structuredData 
   * @returns 
   */
  encode(structuredData) {
    this.#strBuffer = "";
    this.#paramsBuffer = [];
    
    if (structuredData.size() === 0) {
      return NILVALUE;
    }
    
    let cache = this.#cache.get(structuredData);
    if(!cache) {
      structuredData.accept(this);
      if(structuredData.isFrozen()) {
        this.#cache.set(structuredData, this.#strBuffer);
      }
      cache = this.#strBuffer;
    }

    this.#strBuffer = "";
    this.#paramsBuffer = [];
    return cache;
  }

  /**
   * 
   * @override
   * @param {string} sdId 
   */
  visitStartSdId(sdId){
    this.#strBuffer += `[${sdId}`;
    this.#paramsBuffer = [];
  }

  /**
   * @override
   */
  visitEndSdId() {
    this.#strBuffer = this.#strBuffer + this.#paramsBuffer.join("") + "]"
  }

  /**
   * 
   * @override
   * @param {string} key 
   * @param {string} value 
   */
  visitParam(key, value) {
    this.#paramsBuffer.push(` ${key}="${value}"`);
  }

}
