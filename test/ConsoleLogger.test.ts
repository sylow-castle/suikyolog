import { describe, it, expect, vi } from 'vitest';
import { ConsoleLogger } from '../src/ConsoleLogger.js';
import { SyslogStmt } from '../src/SyslogStmt.js';

describe('Logger', () => {
  it('内部的にはconsole.logを呼ぶ', () => {
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

  it('各種設定ができる', () => {
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

  it('ログレベルのメソッドは渡したインスタンスの設定を変更しない', () => {
    const logger = new ConsoleLogger()
      .ver(1)
      .fac(20)
      .host("localhost")
      .app("suikyo")
      .proc("testConsoleLogger")
      .msgId("test");

    const now = new Date();
    const stmt = logger.createSyslogStmt().time(now);
    stmt.sev(1);

    ["emerg", "alert", "crit", "err", "warn", "notice", "info", "debug"].forEach(test => {
      const upper = test.charAt(0).toUpperCase() + test.slice(1);
      logger[test](stmt);
      expect(stmt.toString("rfc5424")).toBe(`<161> 1 ${now.toISOString()} localhost suikyo testConsoleLogger test -`);
    });

  });

});