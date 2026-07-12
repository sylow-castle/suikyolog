import { describe, it, expect, vi } from 'vitest';
import { SyslogStmt } from '../src/SyslogStmt.js';
import { StructuredData } from '../src/StructuredData.js';


const BOM = "\uFEFF";
const testMessage = "test message";
describe('SyslogStmt', () => {
  it("simpleモードでの典型例", () => {
    const time = new Date();
    const stmt = new SyslogStmt().gen(testMessage).time(time);

    expect(stmt.toString("simple")).toBe(`[Alert] ${time.toISOString()} test message`);
  });

  it("rfc5424モードでの典型例", () => {
    const now = new Date();
    const builder = new SyslogStmt();
    const stmt = builder.gen(testMessage)
      .time(now)
      .fac(20)
      .sev(2)
      .host("localhost")
      .app("suikyo")
      .proc("testSyslogStmt")
      .msgId("rfc5424")

    expect(stmt.toString(undefined)).toBe(`<162> 1 ${now.toISOString()} localhost suikyo testSyslogStmt rfc5424 - ${BOM}test message`);
  });

  it("rfc5424モードでの典型例(構造化データ付き)", () => {
    const now = new Date();
    const builder = new SyslogStmt();
    const sd = new StructuredData().add("testSdId", "testKey", "testValue");
    const stmt = builder.gen(testMessage)
      .time(now)
      .host(undefined)
      .app(undefined)
      .proc(undefined)
      .msgId(undefined)
      .sd(sd);

    expect(stmt.toString("rfc5424")).toBe(`<129> 1 ${now.toISOString()} - - - - ${sd.toString()} ${BOM}${testMessage}`);
  });

  it("各重大度のメソッドはその重大度を設定する", () => {
    const now = new Date();
    const stmt = new SyslogStmt().gen(testMessage).time(now);

    //初期値は重大度1
    expect(stmt.toString("rfc5424")).toBe(`<129> 1 ${now.toISOString()} - - - - - ${BOM}${testMessage}`);

    const expectPairs = {
      emerg: "128",
      crit: "129",
      alert: "130",
      err: "131",
      warn: "132",
      notice: "133",
      info: "134",
      debug: "135",
    };

    for (const [name, sev] of Object.entries(expectPairs)) {
      stmt[name]();
      expect(stmt.toString("rfc5424")).toBe(`<${sev}> 1 ${now.toISOString()} - - - - - ${BOM}${testMessage}`);
    }
  });

  it("versionのバリデーション", () => {
    const stmt = new SyslogStmt();
    const testArgs = [-1, 2, null, undefined];
    for (const invalidArg of testArgs) {
      expect(() => stmt.ver(invalidArg)).toThrow(/Invalid version:/);
    }
  });

  it("severityのバリデーション", () => {
    const stmt = new SyslogStmt();
    const testArgs = [-1, 8, null, undefined, "1", "Emergency"];
    for (const invalidArg of testArgs) {
      expect(() => stmt.sev(invalidArg)).toThrow(/Invalid severity:/);
    }
  });

  it("facilityのバリデーション", () => {
    const stmt = new SyslogStmt();
    const testArgs = [-1, 24, null, undefined, "Kernel", "Local0"];
    for (const invalidArg of testArgs) {
      expect(() => stmt.fac(invalidArg)).toThrow(/Invalid facility:/);
    }
  });

  it("timestampのバリデーション", () => {
    const stmt = new SyslogStmt();
    const testArgs = [undefined, "test", {}];
    for (const invalidArg of testArgs) {
      expect(() => stmt.time(invalidArg)).toThrow(/Invalid timestamp:/);
    }
  });

  it("hostnameのバリデーション", () => {
    const stmt = new SyslogStmt();
    const longStr = "a".repeat(256);
    const testArgs = [longStr, "ホストネーム"]
    for (const invalidArg of testArgs) {
      expect(() => stmt.host(invalidArg)).toThrow(/Invalid hostname:/);
    }
  });

  it("appnameのバリデーション", () => {
    const stmt = new SyslogStmt();
    const longStr = "a".repeat(49);
    const testArgs = [longStr, "アプリケーション名"]
    for (const invalidArg of testArgs) {
      expect(() => stmt.app(invalidArg)).toThrow(/Invalid appname:/);
    }
  });

  it("procIdのバリデーション", () => {
    const stmt = new SyslogStmt();
    const longStr = "a".repeat(129);
    const testArgs = [longStr, "プロセスID"]
    for (const invalidArg of testArgs) {
      expect(() => stmt.proc(invalidArg)).toThrow(/Invalid procId:/);
    }
  });

  it("msgIdのバリデーション", () => {
    const stmt = new SyslogStmt();
    const longStr = "a".repeat(33);
    const testArgs = [longStr, "メッセージID"]
    for (const invalidArg of testArgs) {
      expect(() => stmt.msgId(invalidArg)).toThrow(/Invalid msgId:/);
    }
  });

  it("sdのバリデーション", () => {
    const stmt = new SyslogStmt();
    const testArgs = ["--"];
    for (const invalidArg of testArgs) {
      expect(() => stmt.sd(invalidArg)).toThrow(/Invalid structuredData:/);
    }
  });

  it("sevNumはsevStrの逆写像である", () => {
    const sevNum = SyslogStmt.sevNum;
    const sevStr = SyslogStmt.sevStr;
    for (const [str, int] of Object.entries(sevNum)) {
      expect(sevStr[sevNum[str]]).toBe(str);
      expect(sevNum[sevStr[int]]).toBe(int);
    }
  });

  it("facNumはfacStrの逆写像である", () => {
    const facNum = SyslogStmt.facNum;
    const facStr = SyslogStmt.facStr;
    for (const [str, int] of Object.entries(facNum)) {
      expect(facStr[facNum[str]]).toBe(str);
      expect(facNum[facStr[int]]).toBe(int);
    }
  });

  it("制御文字エスケープ（TAB、LF、CRを除く）", () => {
    const ctrls = ["\x00", "\x08", "\x0B", "\x0C", "\x0E", "\x1F", "\x7F", "\u200B", "\u200F", "\uFEFF", "\uFFFE", "\uFFFF"];
    const escaped = ["\\x00", "\\x08", "\\x0B", "\\x0C", "\\x0E", "\\x1F", "\\x7F", "\\u200B", "\\u200F", "\\uFEFF", "\\uFFFE", "\\uFFFF"];

    expect(ctrls.length).toBe(escaped.length);
    for (let i = 0; i < ctrls.length; i++) {
      expect(SyslogStmt.escapeControlChars(ctrls[i])).toBe(escaped[i]);
    }

    const unscaped = ["\x09", "\x0A", "\x0D"];
    for (const char of unscaped) {
      expect(SyslogStmt.escapeControlChars(char)).toBe(char);
    }
  });
});

