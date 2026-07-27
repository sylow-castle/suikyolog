import { describe, test, expect, vi } from 'vitest';
import { ConsoleLogger } from '../src/core/ConsoleLogger.js';
import { SyslogStmtBuilder } from '../src/core/SyslogStmt.js';
import { SimpleEncoder } from '../src/core/SimpleEncoder.js';
import { SyslogEncoder } from '../src/core/SyslogEncoder.js';
import { SEVERITY_NUM } from '../src/core/Rfc5424Rule.js';
import { TransporterBuilder } from '../src/core/TransporterBuilder.js';
import { ConsoleWriter } from '../src/core/ConsoleWriter.js';

describe("ConsoleLoggerクラスのテスト", () => {
  test('内部的にはconsole.logを呼ぶ', () => {
    // console.log をスパイ（監視）する
    const spy = vi.spyOn(console, 'log').mockImplementation(() => { });

    const logger = new ConsoleLogger(TransporterBuilder
      .start(1)
      .encodedBy(new SimpleEncoder())
      .write(new ConsoleWriter())
      .end()).fac(20);
    const time = new Date();
    const stmt = new SyslogStmtBuilder().msg(`test message`).time(time).build();

    logger.log(stmt);

    expect(spy).toHaveBeenCalledWith(expect.stringContaining(`[129] ${time.toISOString()} test message`));

    // 後始末 
    spy.mockRestore();
  });

  test('トランスポート層でエラーが発生した場合登録していたエラーハンドラーを呼び出す', async () => {
    const spy = vi.spyOn(console, 'log')
      .mockImplementation(() => { throw new Error('console log error') });

    const errorHandler = vi.fn();
    const logger = new ConsoleLogger(
      TransporterBuilder.start(7)
        .encodedBy(new SyslogEncoder())
        .write(new ConsoleWriter({
          onError: errorHandler
        }))
        .end()
    ).fac(20);
    logger.onError(errorHandler)
    const stmt = new SyslogStmtBuilder().emerg().msg(`test message`).build();

    logger.log(stmt);
    await vi.waitFor(() => {
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "console log error"
        })
      );

    });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('ロガーを通じてSyslogStmtBuilderの各状態を設定できる', () => {
    const tp = TransporterBuilder
      .start(6)
      .encodedBy(new SyslogEncoder())
      .write(new ConsoleWriter())
      .end();

    const logger = new ConsoleLogger(tp).ver(0)
      .fac(20)
      .host("localhost")
      .app("suikyo")
      .proc("testConsoleLogger")
      .msgId("test");

    const now = new Date();
    const stmt = logger.createSyslogStmt("test message", null, now);
    const encoder = new SyslogEncoder();

    expect(encoder.encode(stmt)).toBe(`<161>0 ${now.toISOString()} localhost suikyo testConsoleLogger test - test message`);
  });

  test(`stopすると何も出力しない。resumeすると再び出力する`, () => {
    const logger = new ConsoleLogger(TransporterBuilder.start(SEVERITY_NUM.Debug)
      .encodedBy(new SyslogEncoder())
      .write(new ConsoleWriter())
      .end()
    ).stop();
    const stmt = logger.createSyslogStmt();

    //コンソールに出力させないためのモック利用
    const spy = vi.spyOn(console, 'log').mockImplementation(() => { });

    logger.stop().log(stmt);
    expect(spy).toHaveBeenCalledTimes(0);


    logger.resume().log(stmt);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

});