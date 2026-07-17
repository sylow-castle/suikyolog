import { describe, test, expect } from 'vitest';
import { SyslogStmt } from '../src/SyslogStmt.js';
import { MutableStructuredData } from '../src/MutableStructuredData.js';
import { SyslogEncoder, StructuredDataEncoder } from '../src/SyslogEncoder.js';
import { SimpleEncoder } from '../src/SimpleEncoder.js';
import { Encoder } from '../src/Encoder.js';

const BOM = "\uFEFF";
const testMessage = "test message";
describe("SyslogStmtクラスのテスト", () => {
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
    const encoder = new SyslogEncoder();

    expect(encoder.encode(stmt)).toBe(`<162> 1 2026-07-12T23:20:19.423Z localhost suikyo testSyslogStmt rfc5424 - ${BOM}test message`);
  });

  test("rfc5424モードでの典型例(構造化データ付き)", () => {
    const now = new Date();
    const builder = new SyslogStmt();
    const sd = new MutableStructuredData().add("testSdId", "testKey", "testValue");
    const stmt = builder.gen(testMessage)
      .time(now)
      .host(undefined)
      .app(undefined)
      .proc(undefined)
      .msgId(undefined)
      .sd(sd);
    const encoder = new SyslogEncoder();
    const sdEncoder = new StructuredDataEncoder();
    const sdStr = sdEncoder.encode(sd);

    expect(encoder.encode(stmt)).toBe(`<129> 1 ${now.toISOString()} - - - - ${sdStr} ${BOM}${testMessage}`);
  });

  test.for([
    { severity: "emerg", expectPri: 128 },
    { severity: "alert", expectPri: 129 },
    { severity: "crit", expectPri: 130 },
    { severity: "err", expectPri: 131 },
    { severity: "warn", expectPri: 132 },
    { severity: "notice", expectPri: 133 },
    { severity: "info", expectPri: 134 },
    { severity: "debug", expectPri: 135 },
  ])(`重大度メソッドはその重大度に設定する（severity: $severity）`, ({ severity, expectPri }) => {
    const now = new Date();
    const stmt = new SyslogStmt().gen(testMessage).time(now);
    const encoder = new SyslogEncoder();

    //初期値は重大度1
    expect(encoder.encode(stmt)).toBe(`<129> 1 ${now.toISOString()} - - - - - ${BOM}${testMessage}`);
    stmt[severity]();
    expect(encoder.encode(stmt)).toBe(`<${expectPri}> 1 ${now.toISOString()} - - - - - ${BOM}${testMessage}`);
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



  test.for([
    { ctrl: "\x09", ret: "\t" },
    { ctrl: "\x0A", ret: "\n" },
    { ctrl: "\x0D", ret: "\r" },
  ])(`制御文字をエスケープしない（TAB、LF、CR）ctrl ：$escaped`, ({ ctrl, ret }) => {
    expect(Encoder.escapeControlChars(ctrl)).toBe(ret);
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
    expect(Encoder.escapeControlChars(ctrl)).toBe(ret);
  });
});

