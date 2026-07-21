import { vi, test, describe, expect } from "vitest";
import { FanoutTransporter } from "../src/core/FanoutTransporter.js";
import { SyslogEncoder } from "../src/core/SyslogEncoder.js";
import { SyslogStmt, SyslogStmtBuilder } from "../src/core/SyslogStmt.js";
import { ConsoleWriter } from "../src/core/ConsoleWriter.js";


describe("MultipleTransporterのテスト", () => {
  test('2個指定したら2回呼ばれる', async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => { });

    const transporter1 = new ConsoleWriter({});
    transporter1.setEncoder(new SyslogEncoder())
    const transporter2 = new ConsoleWriter({});
    transporter2.setEncoder(new SyslogEncoder())

    const transporter = new FanoutTransporter([transporter1, transporter2])
    try {
      const now = Date.now();
      const stmt = new SyslogStmtBuilder().msg("test").time(now).build();
      transporter.transport(stmt);
      const str = new SyslogEncoder().encode(stmt);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining(str));
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }

    // 後始末 
  });
});