import { describe, test, expect, vi } from 'vitest';
import { ConsoleLogger } from '../src/ConsoleLogger.js';
import { SyslogStmt } from '../src/SyslogStmt.js';

describe("ConsoleLoggerクラスのテスト", () => {
  test('内部的にはconsole.logを呼ぶ', () => {
    // console.log をスパイ（監視）する
    const spy = vi.spyOn(console, 'log').mockImplementation(() => { });

    const logger = new ConsoleLogger().level(1).fac(20);
    const time = new Date();
    const stmt = new SyslogStmt().gen(`test message`).time(time);

    logger.log(stmt, "simple")

    expect(spy).toHaveBeenCalledWith(expect.stringContaining(`[Alert] ${time.toISOString()} test message`));

    // 後始末
    spy.mockRestore();
  });

  test('ロガーを通じてSyslogStmtの各状態を設定できる', () => {
    const logger = new ConsoleLogger().level(6)
      .ver(0)
      .fac(20)
      .host("localhost")
      .app("suikyo")
      .proc("testConsoleLogger")
      .msgId("test");

    const now = new Date()
    const stmt = logger.createSyslogStmt().gen(`test message`).time(now);
    const BOM = "\uFEFF";

    expect(stmt.toString("rfc5424")).toBe(`<161> 0 ${now.toISOString()} localhost suikyo testConsoleLogger test - ${BOM}test message`);
  });

  test.for([
    { severity: "emerg" },
    { severity: "alert" },
    { severity: "crit" },
    { severity: "err" },
    { severity: "warn" },
    { severity: "notice" },
    { severity: "info" },
    { severity: "debug" },
  ])(`重大度メソッドは渡したインスタンスの設定を変更しない（severity: $severity）`, ({ severity }) => {
    const logger = new ConsoleLogger()
      .ver(1)
      .fac(20)
      .host("localhost")
      .app("suikyo")
      .proc("testConsoleLogger")
      .msgId("test");

    const now = new Date();
    const stmt = logger.createSyslogStmt().time(now);

    //コンソールに出力させないためのモック利用
    const spy = vi.spyOn(console, 'log').mockImplementation(() => { });

    stmt.sev(1);
    logger.level(7);
    logger[severity](stmt);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(stmt.toString("rfc5424")).toBe(`<161> 1 ${now.toISOString()} localhost suikyo testConsoleLogger test -`);

    spy.mockRestore();
  });

});