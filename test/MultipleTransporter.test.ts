import {vi,test,describe,expect} from "vitest";
import { StdoutWriter } from "../src/node/StdoutTransporter.js"
import { stdout } from "node:process";
import { FanoutTransporter } from "../src/core/FanoutTransporter.js";
import { TransporterBuilder } from "../src/core/TransporterBuilder.js";
import { SyslogEncoder } from "../src/core/SyslogEncoder.js";
import { SyslogStmt } from "../src/core/SyslogStmt.js";


describe("MultipleTransporterのテスト",() => {
  test('2個指定したら2回呼ばれる', async () => {
    const spy = vi.spyOn(stdout, "write").mockImplementation(() => { });

    TransporterBuilder.start
    const transporter1 = new StdoutWriter({});
    transporter1.setEncoder(new SyslogEncoder())
    const transporter2 = new StdoutWriter({});
    transporter2.setEncoder(new SyslogEncoder())

    const transporter = new FanoutTransporter([transporter1, transporter2])
    try {
      const now = Date.now();
      const stmt = new SyslogStmt().gen("test").time(now);
      transporter.transport(stmt);
      const str = new SyslogEncoder().encode(stmt);
      console.error(str);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining(str));
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }

    // 後始末 
  });
});