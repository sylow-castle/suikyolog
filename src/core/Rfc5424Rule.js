

export const NILVALUE = "-";

const FACILITY_MIN = 0
const FACILITY_MAX = 23
export const FACILITY_NUM = Object.freeze({
  kern: FACILITY_MIN,
  user: 1,
  mail: 2,
  daemon: 3,
  auth: 4,
  syslog: 5,
  lpr: 6,
  news: 7,
  uucp: 8,
  cron: 9,
  authpriv: 10,
  ftp: 11,
  ntp: 12,
  audit: 13,
  alert: 14,
  clock: 15,
  local0: 16,
  local1: 17,
  local2: 18,
  local3: 19,
  local4: 20,
  local5: 21,
  local6: 22,
  local7: FACILITY_MAX,
});

export const FACILITY_STR = Object.freeze([
  "kern",
  "user",
  "mail",
  "daemon",
  "auth",
  "syslog",
  "lpr",
  "news",
  "uucp",
  "cron",
  "authpriv",
  "ftp",
  "ntp",
  "audit",
  "alert",
  "clock",
  "local0",
  "local1",
  "local2",
  "local3",
  "local4",
  "local5",
  "local6",
  "local7",
]);

const SEVERITY_MIN = 0
const SEVERITY_MAX = 7
export const SEVERITY_NUM = Object.freeze({
  Emerg: SEVERITY_MIN,
  Alert: 1,
  Crit: 2,
  Err: 3,
  Warn: 4,
  Notice: 5,
  Info: 6,
  Debug: SEVERITY_MAX,
});

export const SEVERITY_STR = Object.freeze([
  "Emerg",
  "Alert",
  "Crit",
  "Err",
  "Warn",
  "Notice",
  "Info",
  "Debug",
]);


/**
 * 整数からPRI値を計算する。
 * @param {number} facility 
 * @param {number} severity 
 * @returns {number}
 */
export function getPri(facility, severity) {
  if (!Number.isInteger(facility)) {
    throw new Error(`Invalid facility: ${facility}`);
  }

  if (!Number.isInteger(severity)) {
    throw new Error(`Invalid severity: ${severity}`);
  }

  if (facility < FACILITY_MIN || FACILITY_MAX < facility) {
    throw new Error(`Invalid facility: ${facility}`);
  }

  if (severity < SEVERITY_MIN || SEVERITY_MAX < severity) {
    throw new Error(`Invalid severity: ${severity}`);
  }

  return facility * 8 + severity;
}

export const VERSION = 1;

export const isValidHostname = createHeaderElementValidator(/^[\x21-\x7E]{1,255}$/);
export const isValidAppName = createHeaderElementValidator(/^[\x21-\x7E]{1,48}$/);
export const isValidProcessId = createHeaderElementValidator(/^[\x21-\x7E]{1,128}$/);
export const isValidMsgId = createHeaderElementValidator(/^[\x21-\x7E]{1,32}$/);

/**
 * HOSTNAME、APP-NAME、PROCID,MSGID用のバリデータを作成する関数
 * @param {RegExp} regExp 正規表現。
 * @returns {(value: string) => boolean}
 */
function createHeaderElementValidator(regExp) {
  return function (value) {
    if (typeof value !== "string") {
      return false;
    }
    if (value === NILVALUE) {
      return true;
    }

    return regExp.test(value);
  }
}

const SDNAME_VALID = /^[\x21-\x7E]{1,32}$/
const SDNAME_EXCEPTIONS = /[=\]"\s]/

/**
 * SD-NAMEの長さと文字種チェックをする関数。除外文字列についてはチェックしない。
 * @param {string} sdname 
 * @returns {boolean}
 */
export function isValidSdName(sdname) {
  return SDNAME_VALID.test(sdname);
}

/**
 * SD-NAMEが禁止文字を含んでいるかチェックする関数
 * @param {string} sdname 
 * @returns {boolean}
 */
export function hasSdNameExceptions(sdname) {
  return SDNAME_EXCEPTIONS.test(sdname);
}

export function escapeParamValue(value) {
  // ], ", \ をエスケープする処理
  return String(value).replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/]/g, '\\]');
}