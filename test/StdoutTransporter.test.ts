import {vi,test,describe,expect} from "vitest";
import { StdoutWriter } from "../src/node/StdoutWriter.js"
import { stdout } from "node:process";
import { SyslogEncoder } from "../src/core/SyslogEncoder.js";
import { SyslogStmt } from "../src/core/SyslogStmt.js";


describe("StdoutTransporterのテスト",() => {
  test('内部的にはstdout.writeを呼ぶ', () => {
    const spy = vi.spyOn(stdout, "write").mockImplementation(() => { });

    const transporter = new StdoutWriter({})
    let enc;
    transporter.setEncoder( enc = new SyslogEncoder());
    const now = Date.now();
    const stmt = new SyslogStmt().gen("test").time(now)
    const str = enc.encode(stmt)

    transporter.transport(stmt);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(str));

    // 後始末 
    spy.mockRestore();
  });
});