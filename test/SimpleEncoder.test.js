import { describe, test, expect } from "vitest";
import { SimpleEncoder } from "../src/SimpleEncoder";
import { SyslogStmt } from "../src/SyslogStmt";

describe("SimpleEncoderクラスのテスト", () => {
  test("典型的な出力結果", () => {
    const encoder = new SimpleEncoder();
    const now = new Date();
    const st = new SyslogStmt().time(now).gen("test");
    const message = encoder.encode(st);
    expect(message).toBe(`[129] ${now.toISOString()} test`);
  });

  test("SyslogStmt型じゃなくても出力してくれる", () => {
    const encoder = new SimpleEncoder();
    const now = new Date();
    const message = encoder.encode({
      pri: "Info",
      timestamp: now,
      msg: "test"
    });
    expect(message).toBe(`[Info] ${now.toISOString()} test`);
  });




});