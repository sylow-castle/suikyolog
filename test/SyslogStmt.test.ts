import { describe, test, expect, vi } from 'vitest';
import { SyslogStmt } from '../src/SyslogStmt.js';
import { StructuredData } from '../src/StructuredData.js';


const BOM = "\uFEFF";
const testMessage = "test message";
describe("SyslogStmtクラスのテスト", () => {
  test("simpleモードでの典型例", () => {
    const time = new Date();
    const stmt = new SyslogStmt().gen(testMessage).time(time);

    expect(stmt.toString("simple")).toBe(`[Alert] ${time.toISOString()} test message`);
  });

  test("rfc5424モードでの典型例", () => {
    //以下のnowは次の時間のつもり：2026-07-13T23:08:19.423+09:00
    const now = 1783898419423
    const builder = new SyslogStmt();
    const stmt = builder.gen(testMessage)
      .time(now)
      .fac(20)
      .sev(2)
      .host("localhost")
      .app("suikyo")
      .proc("testSyslogStmt")
      .msgId("rfc5424")

    expect(stmt.toString(undefined)).toBe(`<162> 1 2026-07-12T23:20:19.423Z localhost suikyo testSyslogStmt rfc5424 - ${BOM}test message`);
  });

  test("rfc5424モードでの典型例(構造化データ付き)", () => {
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

  test.for([
    { severity: "emerg", expectPri: 128 },
    { severity: "crit", expectPri: 129 },
    { severity: "alert", expectPri: 130 },
    { severity: "err", expectPri: 131 },
    { severity: "warn", expectPri: 132 },
    { severity: "notice", expectPri: 133 },
    { severity: "info", expectPri: 134 },
    { severity: "debug", expectPri: 135 },
  ])(`重大度メソッドはその重大度に設定する（severity: $severity）`, ({ severity, expectPri }) => {
    const now = new Date();
    const stmt = new SyslogStmt().gen(testMessage).time(now);

    //初期値は重大度1
    expect(stmt.toString("rfc5424")).toBe(`<129> 1 ${now.toISOString()} - - - - - ${BOM}${testMessage}`);
    stmt[severity]();
    expect(stmt.toString("rfc5424")).toBe(`<${expectPri}> 1 ${now.toISOString()} - - - - - ${BOM}${testMessage}`);
  });

  test.for([
    { invalidVersion: -1 },
    { invalidVersion: 2 },
    { invalidVersion: null },
    { invalidVersion: undefined },
  ])(`versionのバリデーション（invalidVersion: $invalidVersion）`, ({ invalidVersion }) => {
    const stmt = new SyslogStmt();

    expect(() => stmt.ver(invalidVersion)).toThrow(/Invalid version:/);
  });

  test.for([
    { invalidSeverity: -1 },
    { invalidSeverity: 8 },
    { invalidSeverity: null },
    { invalidSeverity: undefined },
    { invalidSeverity: "1" },
    { invalidSeverity: "Emergency" },
  ])("severityのバリデーション(invalidSeverity: $invalidSeverity)", ({ invalidSeverity }) => {
    const stmt = new SyslogStmt();
    expect(() => stmt.sev(invalidSeverity)).toThrow(/Invalid severity:/);
  });

  test.for([
    { invalidFacility: -1 },
    { invalidFacility: 24 },
    { invalidFacility: null },
    { invalidFacility: undefined },
    { invalidFacility: "kernel" },
    { invalidFacility: "Local0" },
  ])("facilityのバリデーション(invalidFacility: $invalidFacility)", ({ invalidFacility }) => {
    const stmt = new SyslogStmt();
    expect(() => stmt.fac(invalidFacility)).toThrow(/Invalid facility:/);
  });

  test.for([
    { invalidTime: undefined },
    { invalidTime: "test" },
    { invalidTime: {} },
  ])("timestampのバリデーション(invalidTime: $invalidTime)", ({ invalidTime }) => {
    const stmt = new SyslogStmt();
    expect(() => stmt.time(invalidTime)).toThrow(/Invalid timestamp:/);
  });

  test.for([
    { invalidHostname: "a".repeat(256) },
    { invalidHostname: "ホスト名" },
    { invalidHostname: 0 },
  ])("hostnameのバリデーション(invalidHostname: $invalidHostname)", ({ invalidHostname }) => {
    const stmt = new SyslogStmt();
    expect(() => stmt.host(invalidHostname as any)).toThrow(/Invalid hostname:/);
  });

  test.for([
    { invalidAppname: "a".repeat(49) },
    { invalidAppname: "アプリケーション名" },
    { invalidAppname: 0 },
  ])("appnameのバリデーション(invalidAppname: $invalidAppname)", ({ invalidAppname }) => {
    const stmt = new SyslogStmt();
    expect(() => stmt.app(invalidAppname as any)).toThrow(/Invalid appname:/);
  });

  test.for([
    { invalidProcId: "a".repeat(129) },
    { invalidProcId: "プロセスID" },
    { invalidProcId: 0 },
  ])("procIdのバリデーション(invalidProcId: $invalidProcId)", ({ invalidProcId }) => {
    const stmt = new SyslogStmt();
    expect(() => stmt.proc(invalidProcId as any)).toThrow(/Invalid procId:/);
  });

  test.for([
    { invalidMsgId: "a".repeat(33) },
    { invalidMsgId: "メッセージID" },
    { invalidMsgId: 0 },
  ])("msgIdのバリデーション(invalidMsgId: $invalidMsgId)", ({ invalidMsgId }) => {
    const stmt = new SyslogStmt();
    expect(() => stmt.msgId(invalidMsgId as any)).toThrow(/Invalid msgId:/);
  });

  test.for([
    { invalidSd: "--" },
  ])("sdのバリデーション(invalidSd: $invalidSd)", ({ invalidSd }) => {
    const stmt = new SyslogStmt();
    expect(() => stmt.sd(invalidSd as any)).toThrow(/Invalid structuredData:/);
  });

  test("sevNumはsevStrの逆写像である", () => {
    const sevNum = SyslogStmt.sevNum;
    const sevStr = SyslogStmt.sevStr;
    for (const [str, int] of Object.entries(sevNum)) {
      expect(sevStr[sevNum[str]]).toBe(str);
      expect(sevNum[sevStr[int]]).toBe(int);
    }
  });

  test("facNumはfacStrの逆写像である", () => {
    const facNum = SyslogStmt.facNum;
    const facStr = SyslogStmt.facStr;
    for (const [str, int] of Object.entries(facNum)) {
      expect(facStr[facNum[str]]).toBe(str);
      expect(facNum[facStr[int]]).toBe(int);
    }
  });

  test.for([
    { ctrl: "\x09", ret: "\t" },
    { ctrl: "\x0A", ret: "\n" },
    { ctrl: "\x0D", ret: "\r" },
  ])(`制御文字をエスケープしない（TAB、LF、CR）ctrl ：$escaped`, ({ ctrl, ret }) => {
    expect(SyslogStmt.escapeControlChars(ctrl)).toBe(ret);
  });

  test.for([
    { ctrl: "\x00", ret: "\\x00" },
    { ctrl: "\x08", ret: "\\x08" },
    { ctrl: "\x0B", ret: "\\x0B" },
    { ctrl: "\x0C", ret: "\\x0C" },
    { ctrl: "\x0E", ret: "\\x0E" },
    { ctrl: "\x1F", ret: "\\x1F" },
    { ctrl: "\x7F", ret: "\\x7F" },
    { ctrl: "\u200B", ret: "\\u200B" },
    { ctrl: "\u200F", ret: "\\u200F" },
    { ctrl: "\uFEFF", ret: "\\uFEFF" },
    { ctrl: "\uFFFE", ret: "\\uFFFE" },
    { ctrl: "\uFFFF", ret: "\\uFFFF" },
  ])(`制御文字をエスケープする（TAB、LF、CRを除く）ctrl ：$ret`, ({ ctrl, ret }) => {
    expect(SyslogStmt.escapeControlChars(ctrl)).toBe(ret);
  });
});

