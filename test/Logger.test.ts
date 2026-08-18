import { describe, test, expect, vi } from 'vitest';
import { Logger } from '../src/core/Logger.js';
import { SyslogStmt, SyslogStmtBuilder } from '../src/core/SyslogStmt.js';
import { SimpleEncoder } from '../src/core/SimpleEncoder.js';
import { SyslogEncoder } from '../src/core/SyslogEncoder.js';
import { SEVERITY_NUM } from '../src/core/Rfc5424Rule.js';
import { TransporterBuilder } from '../src/core/TransporterBuilder.js';
import { ConsoleWriter } from '../src/core/ConsoleWriter.js';
import { MemoryWriter } from '../src/core/MemoryWriter.js';
import { NullTransporter } from '../src/core/NullTransporter.js';
import { Encoder } from '../src/core/Encoder.js';

describe("Loggerクラスのテスト", () => {
  test('内部的にはconsole.logを呼ぶ', () => {
    // console.log をスパイ（監視）する
    const spy = vi.spyOn(console, 'log').mockImplementation(() => { });

    const logger = new Logger(TransporterBuilder
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

  test('Errorオブジェクトを渡すとエラーメッセージとスタックトレースを出力する', () => {
    // console.log をスパイ（監視）する
    class MessageEncoder extends Encoder {
      override encode(stmt: SyslogStmt): string {
        return stmt.msg;
      }
    }
    const writer = new MemoryWriter();
    const logger = new Logger(TransporterBuilder
      .start(7)
      .encodedBy(new MessageEncoder())
      .write(writer)
      .end());
    const error = new TypeError("test error message");
    logger.err(error);
    expect(writer.getLogs()[0]).toContain("test error message");

  });

  test('ロガーを通じてSyslogStmtBuilderの各状態を設定できる', () => {
    const tp = TransporterBuilder
      .start(6)
      .encodedBy(new SyslogEncoder())
      .write(new ConsoleWriter())
      .end();

    const logger = new Logger(tp).ver(0)
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
    const logger = new Logger(TransporterBuilder.start(SEVERITY_NUM.Debug)
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

  test(`各種ログレベルのメソッドを呼んだ時のPriは対応するログレベルになる`, () => {
    let writer = new MemoryWriter()
    const logger = new Logger(TransporterBuilder.start(SEVERITY_NUM.Debug)
      .encodedBy(new SimpleEncoder())
      .write(writer)
      .end()
    );
    const now = new Date();
    logger.fac(20);
    const stmt = logger.createSyslogStmt("test", null, now);
    const nowStr = new Date(now).toISOString();
    logger.emerg(stmt);
    logger.alert(stmt);
    logger.crit(stmt);
    logger.err(stmt);
    logger.warn(stmt);
    logger.notice(stmt);
    logger.info(stmt);
    logger.debug(stmt);

    expect(writer.getLogs()).toStrictEqual([
      `[160] ${nowStr} test`,
      `[161] ${nowStr} test`,
      `[162] ${nowStr} test`,
      `[163] ${nowStr} test`,
      `[164] ${nowStr} test`,
      `[165] ${nowStr} test`,
      `[166] ${nowStr} test`,
      `[167] ${nowStr} test`
    ]);
  });

  test(`コンストラクタで不適切な型のオブジェクトを渡すと例外を投げる`, () => {
    const transporter = new NullTransporter();
    const eventTarget = new EventTarget();

    expect(() => { new Logger({ transporter: transporter, eventTarget: null }) }).toThrow(/invalid eventTarget/);
    expect(() => { new Logger({ transporter: null, eventTarget: eventTarget }) }).toThrow(/invalid transporter/);
  });
});